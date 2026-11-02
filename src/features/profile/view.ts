import { Q } from '../quiz/content';
import { authError } from '../auth/view';
import { LEVELS } from '../quiz/content';
import { byDate, levelIdx, sortedAssess } from '../quiz/scoring';
import { show } from '../shell/navigation';
import { sanitizeData } from '../sync/sanitize';
import { Sync } from '../sync/sync';
import { $, bt, card, download, esc, inp, toCsv, toast, today } from '../../lib/dom';
import { registerActions } from '../../lib/actions';
import { sb } from '../../lib/supabase';
import { S, blank, save, setS } from '../../state/store';

export function teacherPayload() {
  return { app: 'FOMO_DETOX_KIT', version: 2, exported: new Date().toISOString(), profile: S.profile, assessments: S.assessments, programs: S.programs };
}
export function assessRows() {
  const rows: (string | number)[][] = [['ma_hs', 'ten', 'lop', 'ngay', 'loai', 'tong_diem_10_40', 'muc', 'lo_trinh_ngay', ...Q.map((_, i) => 'c' + (i + 1))]];
  sortedAssess().forEach(a => {
    const pr = a.programId && S.programs.find(p => p.id === a.programId);
    rows.push([S.profile.code, S.profile.name, S.profile.cls, a.date.slice(0, 10), a.kind, a.score, LEVELS[levelIdx(a.score)].short, pr ? pr.days : '', ...a.answers]);
  });
  return rows;
}

export function render6() {
  const teacher = S.profile.role === 'teacher';
  $('#module-6').innerHTML = `<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <div class="${card}"><h3 class="font-bold text-lg mb-3"><i class="fa-solid fa-id-card text-teal-600 mr-1"></i> Hồ sơ</h3>
      <label class="block text-xs font-semibold text-slate-600 mb-1">Tên đăng nhập</label><input class="${inp} mb-3 bg-slate-50 text-slate-500" value="${esc(S.profile.code)}" disabled>
      <label class="block text-xs font-semibold text-slate-600 mb-1" for="pname">Họ tên</label><input id="pname" maxlength="100" class="${inp} mb-3" value="${esc(S.profile.name)}">
      ${teacher ? '' : `<label class="block text-xs font-semibold text-slate-600 mb-1" for="pcls">Lớp</label><input id="pcls" maxlength="20" class="${inp} mb-3" value="${esc(S.profile.cls)}">`}
      <div class="flex gap-2 flex-wrap"><button data-click="saveProfile" class="${bt} bg-teal-600 hover:bg-teal-700">Lưu hồ sơ</button>
        <button data-click="logout" class="${bt} bg-slate-700 hover:bg-slate-800"><i class="fa-solid fa-right-from-bracket mr-1"></i> Đăng xuất</button></div>
      <h3 class="font-bold text-lg mt-6 mb-3"><i class="fa-solid fa-key text-amber-600 mr-1"></i> Đổi mật khẩu</h3>
      <label class="block text-xs font-semibold text-slate-600 mb-1" for="pnew">Mật khẩu mới (ít nhất 8 ký tự)</label><input id="pnew" type="password" autocomplete="new-password" maxlength="72" class="${inp} mb-3">
      <button data-click="changePassword" class="${bt} bg-amber-600 hover:bg-amber-700">Đổi mật khẩu</button>
      ${teacher ? '' : `<h3 class="font-bold text-lg mt-6 mb-1"><i class="fa-solid fa-chalkboard-user text-indigo-600 mr-1"></i> Tài khoản giáo viên</h3>
      <p class="text-xs text-slate-500 mb-2">Chỉ dành cho giáo viên có mã do nhà trường cấp.</p>
      <div class="flex gap-2"><input id="pcode" autocomplete="off" spellcheck="false" aria-label="Mã giáo viên" placeholder="Mã giáo viên" class="${inp}"><button data-click="claimTeacher" class="${bt} bg-indigo-600 hover:bg-indigo-700 whitespace-nowrap">Xác nhận</button></div>`}
    </div>
    <div class="${card}"><h3 class="font-bold text-lg mb-1"><i class="fa-solid fa-file-export text-indigo-600 mr-1"></i> Xuất kết quả</h3>
      <p class="text-xs text-slate-500 mb-3">File gồm điểm trắc nghiệm và tiến độ lộ trình. Không gồm Góc Ẩn Danh.</p>
      <div class="flex gap-2 flex-wrap"><button data-click="exportCsv" class="${bt} bg-indigo-600 hover:bg-indigo-700">Xuất CSV</button><button data-click="exportJson" class="${bt} bg-indigo-600 hover:bg-indigo-700">Xuất JSON</button></div>
      <h3 class="font-bold text-lg mt-6 mb-1"><i class="fa-solid fa-database text-amber-600 mr-1"></i> Sao lưu &amp; khôi phục</h3>
      <p class="text-xs text-slate-500 mb-3">Dữ liệu lưu trong tài khoản và theo bạn sang thiết bị khác. Bản sao lưu là file riêng phòng khi cần.</p>
      <div class="flex gap-2 flex-wrap items-center"><button data-click="backup" class="${bt} bg-amber-600 hover:bg-amber-700">Tải bản sao lưu</button>
        <label class="${bt} bg-slate-700 hover:bg-slate-800 cursor-pointer">Khôi phục<input type="file" accept=".json" hidden data-change="restore"></label>
        <button data-click="wipe" class="${bt} bg-rose-600 hover:bg-rose-700">Xóa toàn bộ dữ liệu</button></div></div>
    ${teacher ? `<div class="${card} lg:col-span-2"><h3 class="font-bold text-lg mb-1"><i class="fa-solid fa-chalkboard-user text-teal-600 mr-1"></i> Tổng hợp từ file</h3>
      <p class="text-xs text-slate-500 mb-3">Chọn nhiều file JSON do học sinh nộp để xem tổng hợp. Dữ liệu chỉ xử lý trên máy này, không gửi đi đâu.</p>
      <input type="file" accept=".json" multiple data-change="teacherImport" class="text-sm"><div id="tout" class="mt-4"></div></div>` : ''}
  </div>`;
}
export async function saveProfile() {
  const name = $('#pname').value.trim(), clsEl = $('#pcls');
  const patch: { full_name: string; class_name?: string } = { full_name: name };
  if (clsEl) patch.class_name = clsEl.value;
  const { error } = await sb.from('profiles').update(patch).eq('id', Sync.uid);
  if (error) { console.error(error); toast('Không lưu được hồ sơ. Hãy kiểm tra mạng rồi thử lại.'); return; }
  await Sync.pull(); // lấy lại tên lớp đã chuẩn hóa từ máy chủ
  render6(); toast('Đã lưu hồ sơ.');
}
export async function changePassword() {
  const el = $('#pnew'), password = el.value;
  if (password.length < 8) { toast('Mật khẩu cần ít nhất 8 ký tự.'); return; }
  const { error } = await sb.auth.updateUser({ password });
  if (error) { toast(error.code === 'same_password' ? 'Mật khẩu mới phải khác mật khẩu cũ.' : authError(error)); return; }
  el.value = ''; toast('Đã đổi mật khẩu.');
}
export async function claimTeacher() {
  const code = $('#pcode').value.trim();
  if (!code) return;
  const { data, error } = await sb.rpc('claim_teacher', { code });
  if (error || !data) { toast('Mã giáo viên không đúng.'); return; }
  await Sync.pull();
  toast('Tài khoản đã chuyển thành giáo viên.');
  show(7);
}
export const exportCsv = () => download(`fomo-${S.profile.code}.csv`, toCsv(assessRows()), 'text/csv');
export const exportJson = () => download(`fomo-${S.profile.code}.json`, JSON.stringify(teacherPayload(), null, 1));
export const backup = () => download(`fomo-sao-luu-${today()}.json`, JSON.stringify(S, null, 1));
export function wipe() {
  if (!confirm('Xóa toàn bộ dữ liệu trong tài khoản, trên mọi thiết bị? Không thể hoàn tác.')) return;
  if (!confirm('Chắc chắn xóa? Hãy tải bản sao lưu trước nếu cần.')) return;
  const { profile, reminder } = S;
  setS(Object.assign(blank(), { profile, reminder }));
  save(); toast('Đã xóa dữ liệu.'); render6();
}
export function restore(f?: File) {
  if (!f) return;
  f.text().then(t => {
    const d = JSON.parse(t);
    if (!d || !Array.isArray(d.assessments)) throw new Error('bad');
    if (!confirm('Khôi phục sẽ thay thế dữ liệu hiện tại trong tài khoản. Tiếp tục?')) return;
    setS(Object.assign(blank(), { profile: S.profile, reminder: S.reminder }, sanitizeData(d)));
    save(); toast('Đã khôi phục.'); render6();
  }).catch(() => toast('File sao lưu không hợp lệ.'));
}
export function teacherImport(files: FileList) {
  Promise.all([...files].map(f => f.text().then(t => { try { return JSON.parse(t); } catch (e) { return null; } }))).then(all => {
    const data = all.filter(d => d && d.app === 'FOMO_DETOX_KIT' && Array.isArray(d.assessments) && d.profile);
    const out = $('#tout');
    if (!data.length) { out.innerHTML = '<p class="text-sm text-rose-600">Không có file hợp lệ. Hãy chọn file JSON do học sinh xuất (Nộp kết quả cho giáo viên).</p>'; return; }
    const head = ['Mã HS', 'Tên', 'Lớp', 'Số lần KS', 'Điểm đầu', 'Điểm gần nhất', 'Thay đổi', 'Lộ trình', '% hoàn thành'];
    const rows = data.map(d => {
      const as = d.assessments.slice().sort(byDate), f = as[0], l = as[as.length - 1];
      const p = (d.programs || []).slice(-1)[0];
      return [d.profile.code, d.profile.name, d.profile.cls, as.length, f ? f.score : '', l ? l.score : '', f && as.length > 1 ? l.score - f.score : '',
        p ? p.days + ' ngày' : '', p ? Math.round(Object.keys(p.checks).filter(k => p.checks[k]).length / p.days * 100) : ''];
    });
    const v = rows.filter(r => r[6] !== '');
    const avg = v.length ? (v.reduce((a, r) => a + r[6], 0) / v.length).toFixed(1) : 'n/a';
    out.innerHTML = `<p class="text-sm mb-2">${rows.length} học sinh. Thay đổi điểm trung bình (HS có từ 2 lần trắc nghiệm): <b>${avg}</b></p>
      <div class="overflow-x-auto"><table class="w-full text-sm text-left"><tr class="text-xs text-slate-500">${head.map(h => `<th class="py-1 pr-3">${h}</th>`).join('')}</tr>
      ${rows.map(r => `<tr class="border-t border-slate-100">${r.map(c => `<td class="py-1.5 pr-3">${esc(c)}</td>`).join('')}</tr>`).join('')}</table></div>
      <button id="tall" class="${bt} bg-teal-600 hover:bg-teal-700 mt-3">Tải CSV tổng hợp</button>`;
    $('#tall').onclick = () => download('fomo-tong-hop-lop.csv', toCsv([head, ...rows]), 'text/csv');
  });
}

registerActions({
  backup: () => backup(),
  changePassword: () => changePassword(),
  claimTeacher: () => claimTeacher(),
  exportCsv: () => exportCsv(),
  exportJson: () => exportJson(),
  restore: ({ el }) => restore(el.files?.[0]),
  saveProfile: () => saveProfile(),
  teacherImport: ({ el }) => { if (el.files) teacherImport(el.files); },
  wipe: () => wipe(),
});
