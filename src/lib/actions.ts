// Giao diện dựng từ chuỗi HTML nên sự kiện được bắt tập trung tại document.
// Phần tử khai báo <button data-click="tenHanhDong" data-arg="giaTri">, còn hành động đăng ký bằng registerActions.
export interface ActionContext {
  el: HTMLInputElement; // đa số phần tử có sự kiện là ô nhập; dùng được cho nút vì chỉ đọc khi cần
  arg: string;
  event: Event;
}
type Action = (ctx: ActionContext) => void;

const registry = new Map<string, Action>();

export function registerActions(actions: Record<string, Action>) {
  for (const [name, action] of Object.entries(actions)) {
    if (registry.has(name)) throw new Error(`Hành động bị trùng tên: ${name}`);
    registry.set(name, action);
  }
}

for (const type of ['click', 'change', 'input', 'submit'] as const) {
  document.addEventListener(type, event => {
    if (!(event.target instanceof Element)) return;
    const el = event.target.closest<HTMLInputElement>(`[data-${type}]`);
    if (!el) return;
    if (type === 'submit') event.preventDefault();
    const name = el.dataset[type]!;
    const action = registry.get(name);
    if (!action) { console.error(`Chưa đăng ký hành động: ${name}`); return; }
    action({ el, arg: el.dataset.arg ?? '', event });
  });
}

registerActions({ noop: () => {} });
