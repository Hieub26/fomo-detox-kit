const CACHE = 'fomo-detox-kit-__CACHE_VERSION__'; // vite.config.ts điền khi build
const FILES = __PRECACHE_FILES__;

self.addEventListener('install', e => {
  // File không có mã băm phải lấy bản mới nhất, không lấy bản cũ trong cache HTTP của trình duyệt.
  const requests = FILES.map(f => (f.startsWith('assets/') ? f : new Request(f, { cache: 'reload' })));
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(requests)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Chỉ phục vụ file của chính app. Không bao giờ chạm vào yêu cầu đến Supabase, vì đó là dữ liệu riêng của học sinh.
// Luôn lấy từ cache nên app mở ngay cả khi mạng chậm hoặc mất mạng. Bản mới có file sw.js khác, được tải
// về ở nền rồi thay thế toàn bộ cache, nên người dùng thấy bản mới từ lần mở sau.
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;
  e.respondWith(caches.match(e.request.mode === 'navigate' ? './' : e.request).then(r => r || fetch(e.request)));
});
