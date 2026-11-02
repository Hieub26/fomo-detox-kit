// Chỉ đóng gói những icon Font Awesome mà app thực sự dùng: file font 150 KB còn khoảng 6 KB.
// Quét tên fa-* trong index.html và src/, rồi sinh src/styles/icons.css và font rút gọn.
// Không ghép tên icon từ nhiều mảnh (`fa-${x}`), vì script này không thấy được tên đó.
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import subsetFont from 'subset-font';

const FA = 'node_modules/@fortawesome/fontawesome-free';
const FONT_OUT = 'src/styles/fonts/fa-solid-900.subset.woff2';
const CSS_OUT = 'src/styles/icons.css';
const NOT_ICONS = new Set(['fa-solid', 'fa-spin']);

const sources = ['index.html', ...readdirSync('src', { recursive: true }).filter(f => f.endsWith('.ts')).map(f => `src/${f}`)];
const names = [...new Set(sources.flatMap(f => readFileSync(f, 'utf8').match(/\bfa-[a-z0-9-]+/g) ?? []))]
  .filter(n => !NOT_ICONS.has(n))
  .sort();

const allCss = readFileSync(`${FA}/css/all.css`, 'utf8');
const icons = names.map(name => {
  const code = allCss.match(new RegExp(`\\.${name}::before \\{\\s*content: "\\\\([0-9a-f]+)"`))?.[1];
  if (!code || !existsSync(`${FA}/svgs/solid/${name.slice(3)}.svg`)) throw new Error(`Không tìm thấy icon solid: ${name}`);
  return { name, code };
});

const text = icons.map(i => String.fromCodePoint(parseInt(i.code, 16))).join('');
const font = await subsetFont(readFileSync(`${FA}/webfonts/fa-solid-900.woff2`), text, { targetFormat: 'woff2' });

const { version } = JSON.parse(readFileSync(`${FA}/package.json`, 'utf8'));
const css = `/*! Font Awesome Free ${version} by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) */
/* Sinh bởi scripts/build-icons.mjs. Không sửa tay. */
@font-face {
  font-family: 'Font Awesome 6 Free';
  font-style: normal;
  font-weight: 900;
  font-display: block;
  src: url('./fonts/fa-solid-900.subset.woff2') format('woff2');
}
.fa-solid {
  -moz-osx-font-smoothing: grayscale;
  -webkit-font-smoothing: antialiased;
  display: inline-block;
  font-family: 'Font Awesome 6 Free';
  font-style: normal;
  font-variant: normal;
  font-weight: 900;
  line-height: 1;
  text-rendering: auto;
}
.fa-spin { animation: fa-spin 2s linear infinite; }
@keyframes fa-spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .fa-spin { animation: none; } }
${icons.map(i => `.${i.name}::before { content: "\\${i.code}"; }`).join('\n')}
`;

const writeIfChanged = (path, data) => {
  if (!existsSync(path) || !readFileSync(path).equals(Buffer.from(data))) writeFileSync(path, data);
};
writeIfChanged(FONT_OUT, font);
writeIfChanged(CSS_OUT, css);
console.log(`icons: ${icons.length} icon, ${(font.length / 1024).toFixed(1)} KB`);
