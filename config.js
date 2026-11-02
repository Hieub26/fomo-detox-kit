// Cấu hình kết nối. Khóa này là khóa công khai (anon/publishable), được phép nằm trong code vì RLS bảo vệ dữ liệu.
// TUYỆT ĐỐI không đặt service_role hoặc secret key vào đây.
// Giá trị bên dưới là của Supabase chạy local. Khi lên cloud, thay bằng URL và khóa của project thật.
window.FOMO_CONFIG = {
  SUPABASE_URL: 'http://127.0.0.1:54321',
  SUPABASE_ANON_KEY: 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH',
  // Tên đăng nhập được lưu dạng <tên>@<miền> vì Supabase Auth bắt buộc có email. Không có thư nào được gửi đi.
  // Không đổi giá trị này sau khi đã có tài khoản: mọi người sẽ không đăng nhập được nữa.
  USERNAME_EMAIL_DOMAIN: 'aeron2k4.github.io'
};
