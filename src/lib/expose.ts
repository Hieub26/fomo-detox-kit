// Giao diện dựng từ chuỗi HTML dùng onclick="...", nên các hàm đó phải truy cập được từ window.
export function expose(handlers: Record<string, unknown>) {
  Object.assign(window, handlers);
}
