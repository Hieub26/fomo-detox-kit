import { enterApp } from './session';
import { $, esc, toast } from '../../lib/dom';
import { registerActions } from '../../lib/actions';
import { USERNAME_EMAIL_DOMAIN, isConfigured, sb } from '../../lib/supabase';

export const USERNAME_RE = /^[a-z0-9_.]{3,30}$/;
export const usernameToEmail = (u: string) => `${u}@${USERNAME_EMAIL_DOMAIN}`;

export let authMode = 'login';
export const authInput = 'w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500';
export const authLabel = 'block text-xs font-semibold text-slate-600 mb-1';

export function authError(error: unknown) {
  const { code, name, message } = (error ?? {}) as { code?: string; name?: string; message?: string };
  const M: Record<string, string> = {
    invalid_credentials: 'Sai tên đăng nhập hoặc mật khẩu.',
    user_already_exists: 'Tên đăng nhập này đã có người dùng. Hãy chọn tên khác.',
    weak_password: 'Mật khẩu quá yếu. Hãy dùng ít nhất 8 ký tự.',
    over_request_rate_limit: 'Bạn thử quá nhiều lần. Hãy đợi vài phút rồi thử lại.',
    signup_disabled: 'Hệ thống đang tạm khóa đăng ký.',
    email_address_invalid: 'Máy chủ không chấp nhận tên đăng nhập này. Hãy báo thầy cô.',
    email_not_confirmed: 'Máy chủ đang bật xác nhận email. Người quản trị cần tắt "Confirm email" trong Supabase.'
  };
  if (code && M[code]) return M[code];
  if (name === 'AuthRetryableFetchError' || /fetch/i.test(message || '')) return 'Không kết nối được máy chủ. Hãy kiểm tra mạng rồi thử lại.';
  console.error(error);
  return 'Có lỗi xảy ra. Hãy thử lại sau.';
}

export function renderAuth(message?: string) {
  $('#appShell').classList.add('hidden');
  const box = $('#authScreen');
  box.classList.remove('hidden');
  if (!isConfigured) {
    box.innerHTML = authFrame(`<h2 class="text-lg font-bold text-slate-800 mb-2">Chưa cấu hình máy chủ</h2>
      <p class="text-sm text-slate-600">Hãy điền <code>VITE_SUPABASE_URL</code>, <code>VITE_SUPABASE_ANON_KEY</code> và <code>VITE_USERNAME_EMAIL_DOMAIN</code> trong <code>.env.local</code>.</p>`);
    return;
  }
  const signup = authMode === 'signup';
  box.innerHTML = authFrame(`
    <div class="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl mb-5" role="tablist">
      ${[['login', 'Đăng nhập'], ['signup', 'Đăng ký']].map(m => `<button type="button" role="tab" aria-selected="${authMode === m[0]}" data-click="setAuthMode" data-arg="${m[0]}" class="py-2 rounded-lg text-sm font-semibold transition ${authMode === m[0] ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500'}">${m[1]}</button>`).join('')}
    </div>
    <div id="authMsg" role="alert" class="${message ? '' : 'hidden'} mb-4 text-sm rounded-xl px-3 py-2 bg-rose-50 text-rose-800 border border-rose-200">${esc(message || '')}</div>
    <form id="authForm" novalidate class="space-y-3">
      ${signup ? `<div><label class="${authLabel}" for="afName">Họ và tên</label><input id="afName" autocomplete="name" maxlength="100" class="${authInput}"></div>` : ''}
      <div><label class="${authLabel}" for="afUser">Tên đăng nhập</label>
        <input id="afUser" autocomplete="username" autocapitalize="none" spellcheck="false" maxlength="30" class="${authInput}">
        ${signup ? '<p class="text-[11px] text-slate-500 mt-1">3–30 ký tự: chữ không dấu, số, dấu chấm hoặc gạch dưới. Ví dụ: linh.8a2</p>' : ''}</div>
      <div><label class="${authLabel}" for="afPass">Mật khẩu</label><input id="afPass" type="password" autocomplete="${signup ? 'new-password' : 'current-password'}" maxlength="72" class="${authInput}">
        ${signup ? '<p class="text-[11px] text-slate-500 mt-1">Ít nhất 8 ký tự.</p>' : ''}</div>
      ${signup ? `<div><label class="${authLabel}" for="afPass2">Nhập lại mật khẩu</label><input id="afPass2" type="password" autocomplete="new-password" maxlength="72" class="${authInput}"></div>
      <label class="flex items-center gap-2 text-sm text-slate-700 cursor-pointer"><input id="afTeacher" type="checkbox" class="accent-teal-600" data-change="toggleTeacherFields"> Tôi là giáo viên</label>
      <div id="afClassWrap"><label class="${authLabel}" for="afClass">Lớp</label><input id="afClass" maxlength="20" placeholder="Ví dụ: 8A2" class="${authInput}"></div>
      <div id="afCodeWrap" class="hidden"><label class="${authLabel}" for="afCode">Mã giáo viên</label><input id="afCode" autocomplete="off" spellcheck="false" class="${authInput}"></div>` : ''}
      <button id="afSubmit" class="w-full py-3 bg-gradient-to-r from-teal-600 to-indigo-600 text-white font-semibold rounded-xl shadow-md hover:opacity-95 transition">${signup ? 'Tạo tài khoản' : 'Đăng nhập'}</button>
    </form>
    <p class="text-xs text-slate-500 mt-4 text-center">${signup
      ? 'Điểm trắc nghiệm và tiến độ lộ trình sẽ lưu trong tài khoản, giáo viên của lớp xem được. Không dùng tên đăng nhập có thông tin riêng tư.'
      : 'Quên mật khẩu? Nhờ giáo viên của lớp đặt lại giúp bạn.'}</p>`);
  $('#authForm').addEventListener('submit', submitAuth);
}
export function authFrame(inner: string) {
  return `<div class="w-full max-w-md">
    <div class="text-center text-white mb-5">
      <div class="w-14 h-14 mx-auto rounded-2xl bg-white/20 flex items-center justify-center mb-3"><i class="fa-solid fa-brain text-2xl text-teal-100"></i></div>
      <h1 class="font-bold text-2xl tracking-tight">FOMO DETOX KIT</h1>
      <p class="text-xs text-teal-100 mt-1">Trường THCS Nguyễn Tất Thành, Thái Nguyên</p>
    </div>
    <div class="bg-white rounded-2xl shadow-xl p-6">${inner}</div></div>`;
}
export function setAuthMode(m: string) { authMode = m; renderAuth(); }
export function toggleTeacherFields(on: boolean) {
  $('#afClassWrap').classList.toggle('hidden', on);
  $('#afCodeWrap').classList.toggle('hidden', !on);
}
export function showAuthMsg(msg: string) {
  const m = $('#authMsg');
  m.textContent = msg; m.classList.remove('hidden');
}
export async function submitAuth(e: Event) {
  e.preventDefault();
  const val = (id: string) => { const x = document.getElementById(id) as HTMLInputElement | null; return x ? x.value : ''; };
  const username = val('afUser').trim().toLowerCase(), password = val('afPass');
  const signup = authMode === 'signup';
  const teacher = signup && $('#afTeacher').checked;
  if (!USERNAME_RE.test(username)) return showAuthMsg(signup ? 'Tên đăng nhập cần 3–30 ký tự: chữ không dấu, số, dấu chấm hoặc gạch dưới.' : 'Sai tên đăng nhập hoặc mật khẩu.');
  if (signup) {
    if (!val('afName').trim()) return showAuthMsg('Hãy nhập họ và tên.');
    if (password.length < 8) return showAuthMsg('Mật khẩu cần ít nhất 8 ký tự.');
    if (password !== val('afPass2')) return showAuthMsg('Hai lần nhập mật khẩu không giống nhau.');
    if (!teacher && !val('afClass').trim()) return showAuthMsg('Hãy nhập lớp, ví dụ 8A2.');
    if (teacher && !val('afCode').trim()) return showAuthMsg('Hãy nhập mã giáo viên.');
  } else if (!password) return showAuthMsg('Hãy nhập mật khẩu.');

  const btn = $('#afSubmit');
  btn.disabled = true; btn.classList.add('opacity-60');
  try {
    const email = usernameToEmail(username);
    if (signup) {
      const { data, error } = await sb.auth.signUp({ email, password, options: { data: { full_name: val('afName').trim(), class_name: teacher ? null : val('afClass').trim() } } });
      if (error) throw error;
      if (!data.session) throw { code: 'email_not_confirmed' };
      let wrongCode = false;
      if (teacher) {
        const r = await sb.rpc('claim_teacher', { code: val('afCode').trim() });
        wrongCode = !!r.error || !r.data;
      }
      await enterApp(data.user!);
      if (wrongCode) toast('Mã giáo viên không đúng nên tài khoản đang là học sinh. Có thể nhập lại ở Hồ sơ.');
    } else {
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw error;
      await enterApp(data.user);
    }
  } catch (err) {
    showAuthMsg(authError(err));
    btn.disabled = false; btn.classList.remove('opacity-60');
  }
}

registerActions({
  setAuthMode: ({ arg }) => setAuthMode(arg),
  toggleTeacherFields: ({ el }) => toggleTeacherFields(el.checked),
});
