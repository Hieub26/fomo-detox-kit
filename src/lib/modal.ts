import { registerActions } from './actions';

// Cửa sổ nổi dùng chung. Nội dung là chuỗi HTML; các nút bên trong vẫn dùng data-click như mọi nơi khác.
let onEsc: ((e: KeyboardEvent) => void) | null = null;

export function openModal(html: string) {
  let m = document.getElementById('modal');
  if (!m) {
    m = document.createElement('div');
    m.id = 'modal';
    m.dataset.click = 'modalBackdrop';
    m.className = 'fixed inset-0 z-50 flex items-start md:items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto';
    document.body.appendChild(m);
  }
  m.innerHTML = `<div data-click="noop" class="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-8 max-h-[90vh] overflow-y-auto relative">
    <button data-click="closeModal" aria-label="Đóng" class="absolute top-3 right-3 w-9 h-9 rounded-lg hover:bg-slate-100 text-slate-500 z-10"><i class="fa-solid fa-xmark"></i></button>
    <div id="modalBody" class="p-5 sm:p-6">${html}</div></div>`;
  document.body.style.overflow = 'hidden'; // không cho trang nền cuộn khi cửa sổ mở
  if (!onEsc) { onEsc = e => { if (e.key === 'Escape') closeModal(); }; document.addEventListener('keydown', onEsc); }
}
// Cập nhật nội dung cửa sổ đang mở, giữ nguyên khung và vị trí cuộn của trang nền.
export function updateModal(html: string) {
  const body = document.getElementById('modalBody');
  if (body) body.innerHTML = html;
}
export const isModalOpen = () => !!document.getElementById('modal');
export function closeModal() {
  document.getElementById('modal')?.remove();
  document.body.style.overflow = '';
  if (onEsc) { document.removeEventListener('keydown', onEsc); onEsc = null; }
}

registerActions({
  closeModal: () => closeModal(),
  modalBackdrop: ({ el, event }) => { if (event.target === el) closeModal(); }, // chỉ đóng khi bấm vào nền ngoài khung
});
