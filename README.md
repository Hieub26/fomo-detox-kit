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

Dừng database bằng `npm run db:stop`. Service worker chỉ chạy ở bản build; xem thử bản build bằng `npm run build` rồi `npm run preview`. App mở từ cache của service worker, nên sau khi đưa bản mới lên, người dùng thấy bản đó từ lần mở sau.

Icon Font Awesome được rút gọn còn những icon app dùng: `npm run dev` và `npm run build` tự sinh lại `src/styles/icons.css`. Khi dùng icon mới, hãy viết đủ tên `fa-...` trong code, không ghép từ nhiều mảnh, và khởi động lại `npm run dev`.

Tạo mã giáo viên (mã chỉ hiện một lần, chạy lại sẽ đổi mã và mã cũ hết hiệu lực):

```bash
docker exec supabase_db_fomo_detox_kit psql -U postgres -At -c "select private.rotate_teacher_code()"
```

Tạo tài khoản quản trị đầu tiên: đăng ký một tài khoản trên web, rồi nâng quyền bằng SQL (thay `ten_dang_nhap`):

```bash
docker exec supabase_db_fomo_detox_kit psql -U postgres -c "update public.profiles set role = 'admin', class_name = null where username = 'ten_dang_nhap'"
```

Sau đó quản trị viên đổi mã giáo viên và mã quản trị ngay trên web (tab Quản Trị). Cũng có thể đặt mã quản trị bằng SQL: `select private.set_admin_code('<mã dài ít nhất 12 ký tự>')`, rồi người có mã nhập ở mục Hồ sơ → Tài khoản quản trị.

Sau khi đổi migration, chạy `npm run db:types` để sinh lại `src/types/database.ts`. Không sửa tay file này.

## Cấu trúc

```
public/             file tĩnh giữ nguyên tên (icon, manifest)
scripts/            sinh font icon rút gọn
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
   Nâng tài khoản quản trị đầu tiên: `update public.profiles set role = 'admin', class_name = null where username = 'ten_dang_nhap';`
6. Tạo `.env.production` từ `.env.example`: điền URL và khóa **publishable/anon** của project. Không bao giờ đặt `service_role` hoặc secret key vào đó.
7. Chạy `npm run build` rồi đưa thư mục `dist/` lên một hosting có HTTPS.

Không đổi `VITE_USERNAME_EMAIL_DOMAIN` sau khi đã có tài khoản, vì mọi người sẽ không đăng nhập được nữa.

## Trước khi dùng thật

- Điền thông tin thật của phòng tư vấn tâm lý (phòng, giờ, người phụ trách) vào `SUPPORT` trong `src/features/quiz/content.ts`. Thông tin này hiện cho học sinh có kết quả mức Cao.
- Điểm trắc nghiệm: câu 10 ("muốn thay đổi thói quen") mặc định tính ngược (đáp án 1–4 được 4–1 điểm), tổng vẫn 10–40 với ngưỡng 18/28. Migration `20261102020000_review_fixes.sql` tính lại điểm đã lưu theo cách này. Từ `20261102030000_server_score.sql`, database tự tính điểm từ đáp án khi lưu và bỏ qua điểm do app gửi lên.
- Quản trị viên sửa nội dung câu hỏi, đáp án và điểm từng đáp án (1–4) trên trang Quản Trị; bộ câu hỏi nằm trong bảng `quiz_questions`. Đổi điểm sẽ tính lại mọi bài đã làm. Vẫn cố định 10 câu, mỗi câu 4 đáp án, và các nhóm câu trong `GROUPS`. Đổi nội dung câu hỏi giữa đợt khảo sát làm dữ liệu trước và sau không còn đo cùng một câu.
- 10 câu hỏi do nhóm tự xây dựng, tham khảo FOMO-S và PSQI; đây không phải thang đo chuẩn hóa nguyên bản.

## Quyền truy cập

Quyền do Row Level Security trên máy chủ quyết định, không phải giao diện:

- Học sinh chỉ đọc và sửa dữ liệu của mình.
- Giáo viên chỉ đọc được điểm và lộ trình của học sinh thuộc các lớp đã thêm, và không sửa được.
- Góc Ẩn Danh chỉ người viết đọc được qua app.
- Tài khoản chỉ thành giáo viên khi có mã giáo viên hoặc được quản trị viên chỉ định.
- Ai cũng tự đăng ký và tự khai lớp được, nên học sinh chỉ được tính vào lớp sau khi giáo viên lớp đó (hoặc quản trị viên) xác nhận. Đổi lớp thì phải xác nhận lại. Giáo viên vẫn xem được tài khoản đang chờ để quyết định.
- Quản trị viên xóa được tài khoản học sinh và giáo viên; mọi dữ liệu của tài khoản (kể cả Góc Ẩn Danh) bị xóa theo.
- Quản trị viên đọc được hồ sơ, điểm và lộ trình của toàn trường (không đọc được Góc Ẩn Danh), gán lớp cho giáo viên, nâng hoặc gỡ quyền giáo viên, đặt lại mật khẩu học sinh và giáo viên, và đổi mã kích hoạt. Không ai đổi được vai trò của một quản trị viên qua app; việc đó chỉ làm bằng SQL.

Những điều cần biết:

- Ai có mã giáo viên cũng có thể thêm bất kỳ lớp nào, nên hãy giữ mã cẩn thận và đổi mã khi bị lộ.
- Ai có mã quản trị sẽ xem được dữ liệu của cả trường. Chỉ đặt mã quản trị khi cần, và đổi ngay khi bị lộ.
- Giáo viên đặt lại mật khẩu thì về kỹ thuật có thể đăng nhập vào tài khoản học sinh đó.
- Người quản trị project Supabase đọc được mọi dữ liệu, kể cả Góc Ẩn Danh.
- Đây là dữ liệu sức khỏe tâm lý của trẻ vị thành niên. Hãy xin đồng ý của nhà trường và phụ huynh trước khi dùng thật.
