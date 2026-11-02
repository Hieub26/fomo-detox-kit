import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';

// Điền danh sách file đã build (tên có mã băm) vào service worker để app mở được khi offline.
function serviceWorker(): Plugin {
  return {
    name: 'fomo-service-worker',
    apply: 'build',
    enforce: 'post',
    generateBundle(_, bundle) {
      const built = Object.keys(bundle).sort();
      const publicFiles = ['manifest.webmanifest', 'icon.svg'];
      const files = ['./', ...built.filter(f => f !== 'index.html'), ...publicFiles];
      // Băm nội dung, không chỉ tên file: file nào đổi thì service worker cũng đổi và cache được làm mới.
      const hash = createHash('sha256');
      for (const name of built) {
        const item = bundle[name];
        hash.update(item.type === 'asset' ? item.source : item.code);
      }
      for (const name of publicFiles) hash.update(readFileSync(`public/${name}`));
      const version = hash.digest('hex').slice(0, 12);
      const source = readFileSync('src/service-worker.js', 'utf-8')
        .replace('__CACHE_VERSION__', version)
        .replace('__PRECACHE_FILES__', JSON.stringify(files));
      this.emitFile({ type: 'asset', fileName: 'sw.js', source });
    }
  };
}

export default defineConfig({
  base: './', // đường dẫn tương đối để chạy được cả trong thư mục con trên hosting
  plugins: [serviceWorker()],
  server: { host: '127.0.0.1', port: 8000, strictPort: true }
});
