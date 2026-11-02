import { claimAdmin as claimAdminRpc } from '../admin/api';
import { authError } from '../auth/view';
import { show } from '../shell/navigation';
import { Sync } from '../sync/sync';
import { $, bt, card, esc, inp, toast } from '../../lib/dom';
import { registerActions } from '../../lib/actions';
import { sb } from '../../lib/supabase';
import { S, blank, save, setS } from '../../state/store';

export function render6() {
  const teacher = S.profile.role === 'teacher', admin = S.profile.role === 'admin';
  const role = admin ? ['Quản trị viên', 'bg-slate-100 text-slate-700 border-slate-200', 'fa-user-shield']
    : teacher ? ['Giáo viên', 'bg-indigo-50 text-indigo-700 border-indigo-200', 'fa-chalkboard-user']
    : ['Học sinh', 'bg-teal-50 text-teal-700 border-teal-200', 'fa-user-graduate'];
  $('#module-6').innerHTML = `<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <div class="${card}">
      <div class="flex items-center gap-4 pb-5 mb-5 border-b border-slate-100">
        <div class="w-14 h-14 shrink-0 rounded-2xl bg-gradient-to-br from-teal-500 to-indigo-500 text-white text-xl font-bold flex items-center justify-center">${esc((S.profile.name || S.profile.code).trim().charAt(0).toUpperCase())}</div>
        <div class="min-w-0">
          <div class="font-bold text-lg text-slate-900 truncate">${esc(S.profile.name || S.profile.code)}</div>
          <div class="flex items-center gap-2 flex-wrap mt-0.5"><span class="text-sm text-slate-500">@${esc(S.profile.code)}</span>
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-semibold ${role[1]}"><i class="fa-solid ${role[2]}"></i>${role[0]}</span></div>
        </div>
      </div>
      <h3 class="font-bold text-base mb-3"><i class="fa-solid fa-id-card text-teal-600 mr-1"></i> Thông tin</h3>
      <label class="block text-xs font-semibold text-slate-600 mb-1" for="pname">Họ tên</label><input id="pname" maxlength="100" class="${inp} mb-3" value="${esc(S.profile.name)}">
      ${teacher || admin ? '' : `<label class="block text-xs font-semibold text-slate-600 mb-1" for="pcls">Lớp</label><input id="pcls" maxlength="20" class="${inp} mb-1" value="${esc(S.profile.cls)}">
      <p class="text-[11px] mb-3 ${S.profile.approved ? 'text-emerald-700' : 'text-amber-700'}">${!S.profile.cls ? 'Chưa có lớp. Hãy nhập lớp để giáo viên xác nhận.' : S.profile.approved ? `<i class="fa-solid fa-circle-check mr-1"></i>Giáo viên đã xác nhận bạn thuộc lớp ${esc(S.profile.cls)}.` : `<i class="fa-solid fa-hourglass-half mr-1"></i>Đang chờ giáo viên lớp ${esc(S.profile.cls)} xác nhận. Đổi lớp sẽ phải chờ xác nhận lại.`}</p>`}
      <button data-click="saveProfile" class="${bt} bg-teal-600 hover:bg-teal-700">Lưu thay đổi</button>
      <h3 class="font-bold text-base mt-7 mb-3 pt-5 border-t border-slate-100"><i class="fa-solid fa-key text-amber-600 mr-1"></i> Đổi mật khẩu</h3>
      <form data-submit="changePassword" class="space-y-3">
        <input type="text" autocomplete="username" value="${esc(S.profile.code)}" hidden>
        <div><label class="block text-xs font-semibold text-slate-600 mb-1" for="pnew">Mật khẩu mới (ít nhất 8 ký tự)</label><input id="pnew" type="password" autocomplete="new-password" maxlength="72" class="${inp}"></div>
        <div><label class="block text-xs font-semibold text-slate-600 mb-1" for="pnew2">Nhập lại mật khẩu mới</label><input id="pnew2" type="password" autocomplete="new-password" maxlength="72" class="${inp}"></div>
        <div class="flex items-center justify-between flex-wrap gap-3">
          <label class="flex items-center gap-2 text-xs text-slate-600 cursor-pointer"><input type="checkbox" data-change="togglePasswordView" class="accent-teal-600"> Hiện mật khẩu</label>
          <button class="${bt} bg-amber-600 hover:bg-amber-700">Đổi mật khẩu</button></div>
      </form>
      ${!teacher ? '' : `<details class="mt-6"><summary class="text-xs text-slate-500 cursor-pointer">Tài khoản quản trị</summary>
      <p class="text-xs text-slate-500 my-2">Chỉ dành cho giáo viên được nhà trường giao quản trị hệ thống.</p>
      <div class="flex gap-2"><input id="padmin" autocomplete="off" spellcheck="false" aria-label="Mã quản trị" placeholder="Mã quản trị" class="${inp}"><button data-click="claimAdmin" class="${bt} bg-slate-700 hover:bg-slate-800 whitespace-nowrap">Xác nhận</button></div></details>`}
      <div class="mt-7 pt-5 border-t border-slate-100"><button data-click="logout" class="px-4 py-2 text-sm font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition"><i class="fa-solid fa-right-from-bracket mr-1"></i> Đăng xuất</button></div>
    </div>
    <div class="${card}"><h3 class="font-bold text-lg mb-1"><i class="fa-solid fa-database text-indigo-600 mr-1"></i> Dữ liệu của bạn</h3>
      <p class="text-xs text-slate-500 mb-3">Điểm trắc nghiệm, lộ trình và Góc Ẩn Danh lưu trong tài khoản và theo bạn sang thiết bị khác.</p>
      ${admin ? `<p class="text-xs rounded-lg px-3 py-2 mb-3 bg-slate-50 text-slate-600 border border-slate-200"><i class="fa-solid fa-circle-info mr-1"></i>Xem và xuất dữ liệu toàn trường ở tab <button data-click="switchTab" data-arg="8" class="font-semibold text-teal-700 underline">6. Quản Trị</button>.</p>` : ''}
      <div class="flex gap-2 flex-wrap"><button data-click="wipe" class="${bt} bg-rose-600 hover:bg-rose-700">Xóa toàn bộ dữ liệu</button></div></div>
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
  const el = $('#pnew'), el2 = $('#pnew2'), password = el.value;
  if (password.length < 8) { toast('Mật khẩu cần ít nhất 8 ký tự.'); return; }
  if (password !== el2.value) { toast('Hai lần nhập mật khẩu không giống nhau.'); return; }
  const { error } = await sb.auth.updateUser({ password });
  if (error) { toast(error.code === 'same_password' ? 'Mật khẩu mới phải khác mật khẩu cũ.' : authError(error)); return; }
  el.value = ''; el2.value = ''; toast('Đã đổi mật khẩu.');
}
export async function claimAdmin() {
  const code = $('#padmin').value.trim();
  if (!code) return;
  if (!(await claimAdminRpc(code))) { toast('Mã quản trị không đúng.'); return; }
  await Sync.pull();
  toast('Tài khoản đã chuyển thành quản trị viên.');
  show(8);
}
export function wipe() {
  if (!confirm('Xóa toàn bộ dữ liệu trong tài khoản, trên mọi thiết bị? Không thể hoàn tác.')) return;
  if (!confirm('Chắc chắn xóa? Điểm, lộ trình và Góc Ẩn Danh sẽ mất vĩnh viễn.')) return;
  const { profile, reminder } = S;
  setS(Object.assign(blank(), { profile, reminder }));
  save(); toast('Đã xóa dữ liệu.'); render6();
}

registerActions({
  changePassword: () => changePassword(),
  togglePasswordView: ({ el }) => { ['#pnew', '#pnew2'].forEach(id => { $(id).type = el.checked ? 'text' : 'password'; }); },
  claimAdmin: () => claimAdmin(),
  saveProfile: () => saveProfile(),
  wipe: () => wipe(),
});
