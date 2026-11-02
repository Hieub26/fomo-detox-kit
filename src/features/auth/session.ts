import { renderAuth } from './view';
import { bootApp } from '../shell/navigation';
import { offerLegacyImport } from '../sync/sanitize';
import { Sync, cacheKey, refreshIfSafe } from '../sync/sync';
import { $ } from '../../lib/dom';
import { registerActions } from '../../lib/actions';
import { isConfigured, sb } from '../../lib/supabase';

export async function enterApp(user: { id: string }) {
  Sync.uid = user.id;
  const cached = Sync.loadCache();
  const authBox = $('#authScreen');
  authBox.classList.add('hidden');
  authBox.innerHTML = ''; // không giữ mật khẩu vừa nhập trong trang
  $('#appShell').classList.remove('hidden');
  if (cached) bootApp();
  else $('#module-1').innerHTML = '<p class="text-center text-slate-500 py-16"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Đang tải dữ liệu...</p>';
  const changed = await Sync.pull();
  offerLegacyImport();
  if (!cached) bootApp(); else if (changed) refreshIfSafe();
}
export let loggingOut = false;
export async function logout() {
  clearTimeout(Sync.timer);
  await Sync.push();
  if (Sync.isDirty() && !confirm('Còn dữ liệu chưa gửi lên máy chủ và sẽ bị mất nếu đăng xuất. Vẫn đăng xuất?')) return;
  loggingOut = true;
  try { localStorage.removeItem(cacheKey(Sync.uid!)); } catch (e) { /* bỏ qua */ }
  await sb.auth.signOut({ scope: 'local' });
  location.hash = '';
  location.reload();
}
if (isConfigured) sb.auth.onAuthStateChange(ev => {
  // Phiên bị thu hồi (ví dụ giáo viên vừa đặt lại mật khẩu) hoặc đăng xuất ở tab khác.
  if (ev === 'SIGNED_OUT' && !loggingOut && Sync.uid) {
    try { sessionStorage.setItem('fomo_auth_msg', 'Phiên đăng nhập đã kết thúc. Hãy đăng nhập lại.'); } catch (e) { /* bỏ qua */ }
    location.reload();
  }
});

export async function start() {
  if (!isConfigured) return renderAuth();
  let msg = '';
  try { msg = sessionStorage.getItem('fomo_auth_msg') || ''; sessionStorage.removeItem('fomo_auth_msg'); } catch (e) { /* bỏ qua */ }
  const { data } = await sb.auth.getSession();
  if (data.session) await enterApp(data.session.user);
  else renderAuth(msg);
}

registerActions({
  logout: () => logout(),
});
