# FOMO DETOX KIT

App khảo sát FOMO và liệu trình detox 7/14/21 ngày cho học sinh. Giao diện là file tĩnh, tài khoản và dữ liệu lưu trên Supabase.

## Chạy trên máy

Cần Docker và Node.js.

```bash
npm install
cp .env.example .env.local   # giá trị mặc định trỏ tới Supabase local
npm run db:start             # chạy Supabase local, tự áp dụng supabase/migrations
npm run dev                  # mở http://localhost:8000
```

Dừng database bằng `npm run db:stop`. Service worker chỉ chạy ở bản build; xem thử bản build bằng `npm run build` rồi `npm run preview`.

Tạo mã giáo viên (mã chỉ hiện một lần, chạy lại sẽ đổi mã và mã cũ hết hiệu lực):

```bash
docker exec supabase_db_fomo_detox_kit psql -U postgres -At -c "select private.rotate_teacher_code()"
```

Sau khi đổi migration, chạy `npm run db:types` để sinh lại `src/types/database.ts`. Không sửa tay file này.

## Cấu trúc

```
public/             file tĩnh giữ nguyên tên (icon, manifest)
src/
  main.ts           điểm vào
  service-worker.js mẫu service worker, vite.config.ts điền danh sách file khi build
  styles/           Tailwind và CSS chung
  types/            kiểu dữ liệu dùng chung
  state/            dữ liệu của người dùng đang đăng nhập
  lib/              Supabase client, tiện ích DOM
  features/         mỗi thư mục là một chức năng: auth, sync, shell, handbook,
                    quiz, program, audio, community, progress, profile, teacher
supabase/           cấu hình và migration của database
```

## Đưa lên Supabase thật

1. Tạo project tại supabase.com.
2. Vào Authentication → Providers → Email, **tắt "Confirm email"**. Tên đăng nhập được lưu dạng email giả nên không có hộp thư để xác nhận.
3. Vào Authentication → Providers → Email, đặt độ dài mật khẩu tối thiểu là 8.
4. Áp dụng database: `npx supabase link --project-ref <ref>` rồi `npx supabase db push`.
5. Trong SQL Editor, chạy `select private.rotate_teacher_code();` để lấy mã giáo viên. Chỉ đưa mã này cho giáo viên.
6. Tạo `.env.production` từ `.env.example`: điền URL và khóa **publishable/anon** của project. Không bao giờ đặt `service_role` hoặc secret key vào đó.
7. Chạy `npm run build` rồi đưa thư mục `dist/` lên một hosting có HTTPS.

Không đổi `VITE_USERNAME_EMAIL_DOMAIN` sau khi đã có tài khoản, vì mọi người sẽ không đăng nhập được nữa.

## Quyền truy cập

Quyền do Row Level Security trên máy chủ quyết định, không phải giao diện:

- Học sinh chỉ đọc và sửa dữ liệu của mình.
- Giáo viên chỉ đọc được điểm và lộ trình của học sinh thuộc các lớp đã thêm, và không sửa được.
- Góc Ẩn Danh chỉ người viết đọc được qua app.
- Tài khoản chỉ thành giáo viên khi có mã giáo viên.

Những điều cần biết:

- Ai có mã giáo viên cũng có thể thêm bất kỳ lớp nào, nên hãy giữ mã cẩn thận và đổi mã khi bị lộ.
- Giáo viên đặt lại mật khẩu thì về kỹ thuật có thể đăng nhập vào tài khoản học sinh đó.
- Người quản trị project Supabase đọc được mọi dữ liệu, kể cả Góc Ẩn Danh.
- Đây là dữ liệu sức khỏe tâm lý của trẻ vị thành niên. Hãy xin đồng ý của nhà trường và phụ huynh trước khi dùng thật.
