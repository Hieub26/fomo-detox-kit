# HƯỚNG DẪN BỔ SUNG QUYỀN ADMIN (CLAUDE.MD)

Tài liệu này ghi lại kiến trúc, các thay đổi cần thiết và hướng dẫn triển khai quyền **Admin** cho dự án **FOMO DETOX KIT**.

---

## 1. Mục tiêu & Phân cấp vai trò (Roles)

Hiện tại hệ thống có 2 quyền:
- `student`: Học sinh (chỉ xem/sửa dữ liệu của mình).
- `teacher`: Giáo viên (quản lý học sinh theo lớp, xem tiến độ, reset mật khẩu học sinh).

**Bổ sung quyền `admin`:**
- `admin` là Quản trị viên hệ thống trên giao diện Web.
- **Quyền hạn của Admin:**
  1. Xem toàn bộ học sinh và toàn bộ giáo viên ở tất cả các lớp (không bị giới hạn bởi `teacher_classes`).
  2. Xem toàn bộ kết quả khảo sát (`assessments`) và tiến trình detox (`programs`) của toàn trường.
  3. Phân công/gán lớp cho giáo viên hoặc chỉ định tài khoản thành giáo viên.
  4. Reset mật khẩu cho bất kỳ tài khoản nào (`student` hoặc `teacher`).
  5. Đổi mã kích hoạt giáo viên / mã admin trực tiếp từ giao diện web (tùy chọn).

---

## 2. Thay đổi Cơ sở dữ liệu (Supabase SQL)

### 2.1 Cập nhật bảng `profiles`
Cho phép cột `role` nhận giá trị `'admin'`:
```sql
-- Cập nhật check constraint role trong public.profiles
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('student', 'teacher', 'admin'));
```

### 2.2 Thêm hàm kiểm tra `is_admin()`
```sql
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;
```

### 2.3 Cơ chế nâng quyền Admin (`claim_admin`)
Lưu mã hash admin trong `private.app_config`:
```sql
alter table private.app_config add column if not exists admin_code_hash text;

-- Hàm đặt mã admin
create or replace function private.set_admin_code(code text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  update private.app_config set admin_code_hash = extensions.crypt(code, extensions.gen_salt('bf'));
end $$;

-- Hàm claim quyền admin
create or replace function public.claim_admin(code text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare stored text;
begin
  if auth.uid() is null then return false; end if;
  select admin_code_hash into stored from private.app_config;
  if stored is null or extensions.crypt(code, stored) <> stored then return false; end if;
  update public.profiles set role = 'admin', class_name = null where id = auth.uid();
  return true;
end $$;

revoke all on function public.claim_admin(text) from public, anon;
grant execute on function public.claim_admin(text) to authenticated;
```

### 2.4 Cập nhật Row Level Security (RLS)
Cho phép `admin` đọc toàn bộ hồ sơ và dữ liệu:
```sql
-- Profiles: Admin đọc được toàn bộ
drop policy if exists "read own or class profile" on public.profiles;
create policy "read own or class profile" on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.can_view_student(id) or public.is_admin());

-- Assessments: Admin xem được toàn bộ
create policy "admin reads all assessments" on public.assessments for select to authenticated
  using (public.is_admin());

-- Programs: Admin xem được toàn bộ
create policy "admin reads all programs" on public.programs for select to authenticated
  using (public.is_admin());

-- Reset password: Admin có thể reset pass cho mọi user
create or replace function public.admin_reset_password(target uuid, new_password text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if char_length(new_password) not between 8 and 72 then
    raise exception 'password must be 8-72 characters' using errcode = '22023';
  end if;
  update auth.users
    set encrypted_password = extensions.crypt(new_password, extensions.gen_salt('bf')), updated_at = now()
    where id = target;
  delete from auth.sessions where user_id = target;
end $$;

revoke all on function public.admin_reset_password(uuid, text) from public, anon;
grant execute on function public.admin_reset_password(uuid, text) to authenticated;
```

---

## 3. Thay đổi Frontend (TypeScript & Giao diện)

### 3.1 Cập nhật Type Definitions (`src/types/index.ts` & `src/types/database.ts`)
```typescript
// Trong src/types/index.ts
export type UserRole = 'student' | 'teacher' | 'admin';
```

### 3.2 Bổ sung RPC gọi API trong frontend
- Thêm hàm `claimAdmin(code: string)` gọi RPC `claim_admin`.
- Thêm hàm `adminResetPassword(targetId: string, newPass: string)` gọi RPC `admin_reset_password`.

### 3.3 Module / Giao diện Quản trị (`src/features/admin/view.ts`)
Tạo view quản trị dành riêng cho `admin` khi đăng nhập:
1. **Tổng quan toàn trường:**
   - Tổng số tài khoản học sinh, giáo viên.
   - Thống kê tỷ lệ hoàn thành lộ trình detox toàn trường.
2. **Quản lý người dùng & giáo viên:**
   - Danh sách giáo viên và các lớp giáo viên đó phụ trách.
   - Nút reset mật khẩu nhanh cho tài khoản bất kỳ.
   - Chỉ định vai trò (nâng/hạ quyền giáo viên).
3. **Mã kích hoạt:**
   - Đổi mã giáo viên trực tiếp từ web mà không cần vào Supabase SQL.

---

## 4. Cách gán nhanh quyền Admin đầu tiên (Không cần code web ngay)

Chạy câu lệnh SQL trực tiếp trên Supabase Dashboard để thăng cấp tài khoản của bạn thành Admin:

```sql
-- Thay 'ten_dang_nhap_cua_ban' bằng username bạn đã đăng ký trên web
update public.profiles 
set role = 'admin' 
where username = 'ten_dang_nhap_cua_ban';
```

