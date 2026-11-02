import { claimAdmin as claimAdminRpc } from '../admin/api';
import { Q } from '../quiz/content';
import { authError } from '../auth/view';
import { LEVELS } from '../quiz/content';
import { levelIdx, sortedAssess } from '../quiz/scoring';
import { show } from '../shell/navigation';
import { Sync } from '../sync/sync';
import { $, bt, card, download, esc, inp, toCsv, toast } from '../../lib/dom';
import { registerActions } from '../../lib/actions';
import { sb } from '../../lib/supabase';
import { S, blank, save, setS } from '../../state/store';

export function assessRows() {
  const rows: (string | number)[][] = [['ma_hs', 'ten', 'lop', 'ngay', 'loai', 'tong_diem_10_40', 'muc', 'lo_trinh_ngay', ...Q.map((_, i) => 'c' + (i + 1))]];
  sortedAssess().forEach(a => {
    const pr = a.programId && S.programs.find(p => p.id === a.programId);
    rows.push([S.profile.code, S.profile.name, S.profile.cls, a.date.slice(0, 10), a.kind, a.score, LEVELS[levelIdx(a.score)].short, pr ? pr.days : '', ...a.answers]);
  });
  return rows;
}

export function render6() {
  const teacher = S.profile.role === 'teacher', admin = S.profile.role === 'admin';
  const role = admin ? ['Quản trị viên', 'bg-slate-100 text-slate-700 border-slate-200', 'fa-user-shield']
    : teacher ? ['Giáo viên', 'bg-indigo-50 text-indigo-700 border-indigo-200', 'fa-chalkboard-user']
    : ['Học sinh', 'bg-teal-50 text-teal-700 border-teal-200', 'fa-user-graduate'];
  $('#module-6').innerHTML = `<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <div class="${card}"><h3 class="font-bold text-lg mb-3"><i class="fa-solid fa-id-card text-teal-600 mr-1"></i> Hồ sơ</h3>
      <label class="block text-xs font-semibold text-slate-600 mb-1">Tên đăng nhập</label><input class="${inp} mb-3 bg-slate-50 text-slate-500" value="${esc(S.profile.code)}" disabled>
      <p class="text-xs text-slate-600 mb-3">Vai trò: <span class="inline-flex items-center gap-1 ml-1 px-2 py-0.5 rounded-full border font-semibold ${role[1]}"><i class="fa-solid ${role[2]}"></i>${role[0]}</span></p>
      <label class="block text-xs font-semibold text-slate-600 mb-1" for="pname">Họ tên</label><input id="pname" maxlength="100" class="${inp} mb-3" value="${esc(S.profile.name)}">
      ${teacher || admin ? '' : `<label class="block text-xs font-semibold text-slate-600 mb-1" for="pcls">Lớp</label><input id="pcls" maxlength="20" class="${inp} mb-1" value="${esc(S.profile.cls)}">
      <p class="text-[11px] mb-3 ${S.profile.approved ? 'text-emerald-700' : 'text-amber-700'}">${!S.profile.cls ? 'Chưa có lớp. Hãy nhập lớp để giáo viên xác nhận.' : S.profile.approved ? `<i class="fa-solid fa-circle-check mr-1"></i>Giáo viên đã xác nhận bạn thuộc lớp ${esc(S.profile.cls)}.` : `<i class="fa-solid fa-hourglass-half mr-1"></i>Đang chờ giáo viên lớp ${esc(S.profile.cls)} xác nhận. Đổi lớp sẽ phải chờ xác nhận lại.`}</p>`}
      <div class="flex gap-2 flex-wrap"><button data-click="saveProfile" class="${bt} bg-teal-600 hover:bg-teal-700">Lưu hồ sơ</button>
        <button data-click="logout" class="${bt} bg-slate-700 hover:bg-slate-800"><i class="fa-solid fa-right-from-bracket mr-1"></i> Đăng xuất</button></div>
      <h3 class="font-bold text-lg mt-6 mb-3"><i class="fa-solid fa-key text-amber-600 mr-1"></i> Đổi mật khẩu</h3>
      <label class="block text-xs font-semibold text-slate-600 mb-1" for="pnew">Mật khẩu mới (ít nhất 8 ký tự)</label><input id="pnew" type="password" autocomplete="new-password" maxlength="72" class="${inp} mb-3">
      <button data-click="changePassword" class="${bt} bg-amber-600 hover:bg-amber-700">Đổi mật khẩu</button>
      ${teacher || admin ? '' : `<h3 class="font-bold text-lg mt-6 mb-1"><i class="fa-solid fa-chalkboard-user text-indigo-600 mr-1"></i> Tài khoản giáo viên</h3>
      <p class="text-xs text-slate-500 mb-2">Chỉ dành cho giáo viên có mã do nhà trường cấp.</p>
      <div class="flex gap-2"><input id="pcode" autocomplete="off" spellcheck="false" aria-label="Mã giáo viên" placeholder="Mã giáo viên" class="${inp}"><button data-click="claimTeacher" class="${bt} bg-indigo-600 hover:bg-indigo-700 whitespace-nowrap">Xác nhận</button></div>`}
      ${!teacher ? '' : `<details class="mt-6"><summary class="text-xs text-slate-500 cursor-pointer">Tài khoản quản trị</summary>
      <p class="text-xs text-slate-500 my-2">Chỉ dành cho giáo viên được nhà trường giao quản trị hệ thống.</p>
      <div class="flex gap-2"><input id="padmin" autocomplete="off" spellcheck="false" aria-label="Mã quản trị" placeholder="Mã quản trị" class="${inp}"><button data-click="claimAdmin" class="${bt} bg-slate-700 hover:bg-slate-800 whitespace-nowrap">Xác nhận</button></div></details>`}
    </div>
    <div class="${card}"><h3 class="font-bold text-lg mb-1"><i class="fa-solid fa-database text-indigo-600 mr-1"></i> Dữ liệu của bạn</h3>
      <p class="text-xs text-slate-500 mb-3">Dữ liệu lưu trong tài khoản và theo bạn sang thiết bị khác. File CSV gồm điểm trắc nghiệm và tiến độ lộ trình của riêng tài khoản này, không gồm Góc Ẩn Danh.</p>
      ${admin ? `<p class="text-xs rounded-lg px-3 py-2 mb-3 bg-slate-50 text-slate-600 border border-slate-200"><i class="fa-solid fa-circle-info mr-1"></i>Xuất dữ liệu toàn trường ở tab <button data-click="switchTab" data-arg="8" class="font-semibold text-teal-700 underline">6. Quản Trị</button>.</p>` : ''}
      <div class="flex gap-2 flex-wrap"><button data-click="exportCsv" class="${bt} bg-indigo-600 hover:bg-indigo-700">Xuất CSV</button>
        <button data-click="wipe" class="${bt} bg-rose-600 hover:bg-rose-700">Xóa toàn bộ dữ liệu</button></div></div>
  </div>`;
}
export async function saveProfile() {
  const name = $('#pname').value.trim(), clsEl = $('#pcls');
  const patch: { full_name: string; class_name?: string } = { full_name: name };
  if (clsEl) patch.class_name = clsEl.value;
  const { error } = await sb.from('profiles').update(patch).eq('id', Sync.uid!);
  if (error) { console.error(error); toast('Không lưu được hồ sơ. Hãy kiểm tra mạng rồi thử lại.'); return; }
  await Sync.pull(); // lấy lại tên lớp đã chuẩn hóa từ máy chủ
  render6(); toast(S.profile.cls && !S.profile.approved ? 'Đã lưu hồ sơ. Lớp đang chờ giáo viên xác nhận.' : 'Đã lưu hồ sơ.');
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
export async function claimAdmin() {
  const code = $('#padmin').value.trim();
  if (!code) return;
  if (!(await claimAdminRpc(code))) { toast('Mã quản trị không đúng.'); return; }
  await Sync.pull();
  toast('Tài khoản đã chuyển thành quản trị viên.');
  show(8);
}
export const exportCsv = () => download(`fomo-${S.profile.code}.csv`, toCsv(assessRows()), 'text/csv');
export function wipe() {
  if (!confirm('Xóa toàn bộ dữ liệu trong tài khoản, trên mọi thiết bị? Không thể hoàn tác.')) return;
  if (!confirm('Chắc chắn xóa? Điểm, lộ trình và Góc Ẩn Danh sẽ mất vĩnh viễn.')) return;
  const { profile, reminder } = S;
  setS(Object.assign(blank(), { profile, reminder }));
  save(); toast('Đã xóa dữ liệu.'); render6();
}

registerActions({
  changePassword: () => changePassword(),
  claimAdmin: () => claimAdmin(),
  claimTeacher: () => claimTeacher(),
  exportCsv: () => exportCsv(),
  saveProfile: () => saveProfile(),
  wipe: () => wipe(),
});
