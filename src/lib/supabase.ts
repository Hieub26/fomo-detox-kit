import { AuthClient } from '@supabase/auth-js';
import { PostgrestClient } from '@supabase/postgrest-js';
import type { Database } from '../types/database';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
export const USERNAME_EMAIL_DOMAIN = import.meta.env.VITE_USERNAME_EMAIL_DOMAIN as string | undefined;

export const isConfigured = Boolean(url && key && USERNAME_EMAIL_DOMAIN);

// App chỉ cần đăng nhập và đọc ghi bảng. Dùng thẳng hai gói này thay cho @supabase/supabase-js
// để không phải tải Realtime, Storage và Functions, khoảng một phần ba dung lượng JS.
function createClient(url: string, key: string) {
  const base = url.replace(/\/*$/, '/');
  const auth = new AuthClient({
    url: new URL('auth/v1', base).href,
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    storageKey: 'fomo-auth'
  });
  const rest = new PostgrestClient<Database>(new URL('rest/v1', base).href, {
    // Mỗi yêu cầu gửi token của phiên hiện tại, để RLS trên máy chủ biết ai đang hỏi.
    fetch: async (input, init) => {
      const { data } = await auth.getSession();
      const headers = new Headers(init?.headers);
      headers.set('apikey', key);
      if (data.session) headers.set('Authorization', `Bearer ${data.session.access_token}`);
      return fetch(input, { ...init, headers });
    }
  });
  return Object.assign(rest, { auth });
}

// Chỉ dùng sb khi isConfigured là true. Khi chưa cấu hình, app dừng ở màn hình báo lỗi cấu hình.
export const sb = (isConfigured ? createClient(url!, key!) : null) as ReturnType<typeof createClient>;
