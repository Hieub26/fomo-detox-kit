import './styles/globals.css';
import { start } from './features/auth/session';

start();

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  if (import.meta.env.PROD) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  } else {
    // Khi phát triển, gỡ service worker cũ để không phục vụ file từ cache.
    navigator.serviceWorker.getRegistrations().then(list => list.forEach(r => r.unregister()));
  }
}
