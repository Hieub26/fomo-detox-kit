// Mặc định kiểu HTMLInputElement vì đa số truy vấn là ô nhập; phần tử thường cũng dùng được classList, innerHTML.
export const $ = <T extends HTMLElement = HTMLInputElement>(s: string) => document.querySelector(s) as T;
export const esc = (s: unknown) => String(s == null ? '' : s).replace(/[&<>"']/g, (c: string) => (({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as Record<string, string>)[c]));
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
export const pad = (n: number) => String(n).padStart(2, '0');
export function today() { const d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
export const daysBetween = (a: string, b: string) => Math.round((new Date(b + 'T00:00:00').getTime() - new Date(a + 'T00:00:00').getTime()) / 864e5);
export const fmtDate = (s: string) => { const p = String(s).slice(0, 10).split('-'); return p[2] + '/' + p[1] + '/' + p[0]; };
let toastTimer: number | undefined;
export function toast(msg: string) {
  const t = $('#toast'); t.textContent = msg; t.classList.remove('hidden');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.add('hidden'), 3500);
}
export function download(name: string, text: string, type?: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: type || 'application/json' }));
  a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
// Tên học sinh do người dùng nhập: thêm ' để Excel không chạy nội dung bắt đầu bằng = + - @ như công thức.
export const csvCell = (v: unknown) => {
  const t = String(v == null ? '' : v);
  return '"' + (typeof v === 'string' && /^[=+\-@\t\r]/.test(t) ? "'" + t : t).replace(/"/g, '""') + '"';
};
export const toCsv = (rows: unknown[][]) => '﻿' + rows.map(r => r.map(csvCell).join(',')).join('\r\n');
export const card = 'bg-white rounded-2xl p-6 shadow-sm border border-slate-100';

export const inp = 'w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500';
export const bt = 'px-4 py-2 text-white text-sm font-semibold rounded-lg transition';
export const smallBtn = 'px-2.5 py-1 border border-slate-200 rounded-lg text-xs hover:bg-slate-50 whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent';
