import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
export const USERNAME_EMAIL_DOMAIN = import.meta.env.VITE_USERNAME_EMAIL_DOMAIN as string | undefined;

export const isConfigured = Boolean(url && key && USERNAME_EMAIL_DOMAIN);

// Chỉ dùng sb khi isConfigured là true. Khi chưa cấu hình, app dừng ở màn hình báo lỗi cấu hình.
export const sb = (isConfigured ? createClient(url!, key!, { auth: { storageKey: 'fomo-auth' } }) : null) as SupabaseClient;
