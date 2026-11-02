import { render4 } from '../audio/player';
import { render5 } from '../community/view';
import { render1 } from '../handbook/view';
import { render6 } from '../profile/view';
import { render3 } from '../program/view';
import { render2 } from '../quiz/view';
import { render7 } from '../teacher/view';
import { $ } from '../../lib/dom';
import { expose } from '../../lib/expose';
import { S } from '../../state/store';

export const TABS: [number, string, string, string][] = [
  [1, 'fa-book-open', '1. Cẩm Nang Số', 'Cẩm nang'], [2, 'fa-clipboard-question', '2. Trắc Nghiệm FOMO', 'Trắc nghiệm'], [3, 'fa-calendar-check', '3. Lộ Trình Detox', 'Lộ trình'],
  [4, 'fa-headphones', '4. Âm Thanh Sóng Não', 'Âm thanh'], [5, 'fa-chart-line', '5. Góc Chia Sẻ & Badge', 'Chia sẻ']
];
export const TEACHER_TAB: [number, string, string, string] = [7, 'fa-chalkboard-user', '6. Lớp Của Tôi', 'Lớp'];
export const visibleTabs = () => (S.profile.role === 'teacher' ? TABS.concat([TEACHER_TAB]) : TABS);
export let tab = 1, appReady = false;
export function switchTab(n: number) {
  if (location.hash === '#' + n) show(n); else location.hash = '#' + n;
}
export function show(n: number) {
  tab = n;
  for (let i = 1; i <= 7; i++) $('#module-' + i).classList.toggle('hidden', i !== n);
  $('#navTabs').innerHTML = visibleTabs().map(t => `<button onclick="switchTab(${t[0]})" class="flex items-center gap-2 px-3.5 py-2.5 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${t[0] === n ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}"><i class="fa-solid ${t[1]} text-base"></i> <span>${t[2]}</span></button>`).join('');
  $('#bottomNav').innerHTML = visibleTabs().map(t => `<button onclick="switchTab(${t[0]})" aria-current="${t[0] === n}" class="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium ${t[0] === n ? 'text-teal-700' : 'text-slate-500'}"><i class="fa-solid ${t[1]} text-lg ${t[0] === n ? 'bg-teal-100 rounded-full px-3 py-1' : 'py-1'}"></i><span>${t[3]}</span></button>`).join('');
  RENDER[n]();
  window.scrollTo(0, 0);
}
export function refresh() { const y = window.scrollY; RENDER[tab](); window.scrollTo(0, y); }

export const RENDER: Record<number, () => void> = { 1: render1, 2: render2, 3: render3, 4: render4, 5: render5, 6: render6, 7: render7 };
export function routeFromHash() {
  const n = parseInt(location.hash.slice(1));
  if (n === 7 && S.profile.role === 'teacher') return 7;
  return n >= 1 && n <= 6 ? n : 1;
}
export function bootApp() { appReady = true; show(routeFromHash()); }
window.addEventListener('hashchange', () => { if (appReady) show(routeFromHash()); });

expose({ switchTab });
