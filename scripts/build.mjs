import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import { openSync } from 'fontkit';
import { marked } from 'marked';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const assets = join(root, 'assets');
const previews = join(root, '.preview');
mkdirSync(previews, { recursive: true });
const typeface = openSync(join(root, 'sources/Manrope.ttf'));
const fonts = new Map();
const colors = { bg: '#0e0c13', surface: '#17131f', line: '#342c40', text: '#faf7ff', muted: '#b9b2c4', accent: '#c291ff' };
const esc = (s) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
const svg = (width, height, body, title) => `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img"><title>${esc(title)}</title>${body}</svg>`;
const save = (name, source) => writeFileSync(join(assets, name), source);
const render = (source, width) => new Resvg(source, { font: { loadSystemFonts: false }, ...(width ? { fitTo: { mode: 'width', value: width } } : {}) }).render();

function lettering(content, x, y, size, { weight = 500, color = colors.text, spacing = 0 } = {}) {
  if (!fonts.has(weight)) fonts.set(weight, typeface.getVariation({ wght: weight }));
  const font = fonts.get(weight);
  const run = font.layout(content);
  const scale = size / font.unitsPerEm;
  let advance = 0;
  let paths = '';
  run.glyphs.forEach((glyph, i) => {
    if (glyph.id === 0) throw new Error(`Manrope has no glyph for ${content}`);
    const p = run.positions[i];
    const d = glyph.path.toSVG();
    if (d) paths += `<path transform="translate(${advance + p.xOffset} ${p.yOffset})" d="${d}"/>`;
    advance += p.xAdvance + spacing / scale;
  });
  return { body: `<g fill="${color}" transform="translate(${x} ${y}) scale(${scale} ${-scale})">${paths}</g>`, width: advance * scale - spacing };
}
const label = (...args) => lettering(...args).body;
const logoBytes = readFileSync(join(assets, 'stealthcat-logo.png'));
const logo = (x, y, size) => `<image x="${x}" y="${y}" width="${size}" height="${size}" href="data:image/png;base64,${logoBytes.toString('base64')}"/>`;
const pngImage = (data, x, y, width, height) => `<image x="${x}" y="${y}" width="${width}" height="${height}" href="data:image/png;base64,${data.toString('base64')}"/>`;

const motion = `<style>
  #brand-mark { animation: drift 8s ease-in-out infinite; }
  #brand-light { animation: breathe 8s ease-in-out infinite; }
  @keyframes drift { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-2px); } }
  @keyframes breathe { 0%,100% { opacity: .13; } 50% { opacity: .22; } }
  @media (prefers-reduced-motion: reduce) { #brand-mark, #brand-light { animation: none; } }
</style>`;

function profile(mobile = false, animated = true) {
  const width = mobile ? 480 : 900;
  const height = mobile ? 380 : 306;
  const pad = mobile ? 28 : 32;
  const name = lettering('alkafeu', pad, mobile ? 96 : 88, mobile ? 64 : 64, { weight: 650, spacing: -2.2 });
  const mark = mobile ? { x: 326, y: 10, size: 134 } : { x: 624, y: 14, size: 242 };
  const headline = label('Развиваю StealthCat.', pad, mobile ? 157 : 141, 30, { weight: 600, color: colors.accent });
  const body = mobile
    ? label('VPN с подключением', pad, 215, 25, { weight: 450, color: colors.muted }) +
      label('через Telegram.', pad, 249, 25, { weight: 450, color: colors.muted }) +
      label('Бот, веб-интерфейсы', pad, 305, 25, { weight: 450, color: colors.muted }) +
      label('и инфраструктура.', pad, 339, 25, { weight: 450, color: colors.muted })
    : label('VPN с подключением через Telegram.', pad, 187, 21, { weight: 450, color: colors.muted }) +
      label('Бот, веб-интерфейсы и инфраструктура.', pad, 221, 21, { weight: 450, color: colors.muted });
  const bottom = mobile ? '' : `<path d="M32 255 H868" stroke="${colors.line}"/>${label('Интернет, каким ты его любишь.', 32, 286, 18, { weight: 500, color: '#c5acdf' })}`;
  return svg(width, height, `${animated ? motion : ''}
    <defs><radialGradient id="violet-light"><stop stop-color="#7738bd"/><stop offset="1" stop-color="#7738bd" stop-opacity="0"/></radialGradient></defs>
    <rect width="${width}" height="${height}" rx="12" fill="${colors.bg}"/>
    <ellipse${animated ? ' id="brand-light"' : ''} cx="${mark.x + mark.size / 2}" cy="${mark.y + mark.size / 2}" rx="${mark.size * .57}" ry="${mark.size * .52}" fill="url(#violet-light)" opacity=".13"/>
    ${name.body}${label('.', pad + name.width - 1, mobile ? 96 : 88, 64, { weight: 650, color: colors.accent })}
    ${headline}${body}${bottom}
    <g${animated ? ' id="brand-mark"' : ''}>${logo(mark.x, mark.y, mark.size)}</g>
  `, 'alkafeu. Развиваю StealthCat — VPN с подключением через Telegram. Бот, веб-интерфейсы и инфраструктура.');
}
for (const mobile of [false, true]) for (const animated of [false, true]) {
  save(`profile${mobile ? '-mobile' : ''}${animated ? '' : '-static'}.svg`, profile(mobile, animated));
}

function contact(key, text, rightColumn) {
  for (const mobile of [false, true]) {
    const width = mobile ? 190 : 450;
    const height = 56;
    const left = rightColumn ? 5 : 1;
    const cardWidth = width - 6;
    const size = mobile ? 16 : 20;
    const word = lettering(text, 0, 0, size, { weight: 550 });
    const contentWidth = word.width + 25;
    const x = left + (cardWidth - contentWidth) / 2;
    const arrowX = x + word.width + 13;
    const body = `<rect x="${left - .5}" y=".5" width="${cardWidth}" height="55" rx="8" fill="${colors.surface}" stroke="${colors.line}"/>` +
      label(text, x, mobile ? 33 : 35, size, { weight: 550 }) +
      `<path d="M${arrowX} 22 H${arrowX + 9} V31 M${arrowX - 1} 32 L${arrowX + 9} 22" fill="none" stroke="${colors.accent}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`;
    save(`grid-${key}${mobile ? '-mobile' : ''}.svg`, svg(width, height, body, text));
  }
}
contact('website', 'stealthcat.xyz', false);
contact('bot', '@stealthcatbot', true);
contact('telegram', '@alkafeu', false);
contact('github', 'GitHub', true);

const readme = readFileSync(join(root, 'README.md'), 'utf8');
const preview = `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>alkafeu · StealthCat</title><style>
  :root{color-scheme:dark;background:#0d1117;color:#e6edf3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}*{box-sizing:border-box}body{margin:0;padding:24px}.readme{max-width:898px;margin:auto;padding:24px;border:1px solid #30363d;border-radius:6px;font-size:16px;line-height:1.5}.readme img{max-width:100%;height:auto;vertical-align:middle}.readme a{color:#58a6ff;text-decoration:none}.readme a:hover{text-decoration:underline}.readme p{margin:16px 0}.readme p:first-of-type{margin-top:16px}.readme details{margin:16px 0}.readme details img{margin-top:16px}.meta{color:#e6edf3;font-size:12px;margin-bottom:20px}.toolbar{max-width:898px;margin:0 auto 18px;display:flex;justify-content:space-between;align-items:center;color:#8b949e;font-size:12px;gap:20px}button{color:#dfc7fa;background:#17131f;border:1px solid #342c40;border-radius:6px;padding:7px 12px;cursor:pointer}.caption{color:#8b949e;font-size:12px;text-align:center;margin-top:18px}@media(max-width:600px){body{padding:10px}.readme{padding:14px}.toolbar{flex-wrap:wrap}}
  </style></head><body><div class="toolbar"><span>Предпросмотр · ширина блока как на твоём скриншоте</span><button type="button" id="motion" aria-pressed="false">Остановить анимацию</button></div><main class="readme"><div class="meta">alkafeu / README.md</div>${marked.parse(readme).replaceAll('assets/', '../assets/')}</main><p class="caption">Адаптивные SVG для GitHub и телефона. Оригинальный баннер можно раскрыть.</p><script>
  const button=document.getElementById('motion');let paused=false;button.addEventListener('click',()=>{paused=!paused;const hero=document.querySelector('main > picture');hero.querySelectorAll('source').forEach(source=>{if(!source.dataset.original)source.dataset.original=source.getAttribute('srcset');source.setAttribute('srcset',paused?source.dataset.original.replace(/(?<!-static)\\.svg$/,'-static.svg'):source.dataset.original)});const img=hero.querySelector('img');if(!img.dataset.original)img.dataset.original=img.getAttribute('src');img.setAttribute('src',paused?img.dataset.original.replace('.svg','-static.svg'):img.dataset.original);button.textContent=paused?'Включить анимацию':'Остановить анимацию';button.setAttribute('aria-pressed',String(paused))});
  </script></body></html>`;
writeFileSync(join(previews, 'index.html'), preview);

function contactPng(key, mobile) { return render(readFileSync(join(assets, `grid-${key}${mobile ? '-mobile' : ''}.svg`))).asPng(); }
for (const mobile of [false, true]) {
  const width = mobile ? 344 : 898;
  const inset = mobile ? 14 : 24;
  const contentWidth = width - 2 * inset;
  const profileHeight = (mobile ? 380 / 480 : 306 / 900) * contentWidth;
  const contactHeight = contentWidth / 2 * 56 / (mobile ? 190 : 450);
  const top = 58;
  const firstRow = top + profileHeight + 16;
  const secondRow = firstRow + contactHeight + 12;
  const foot = secondRow + contactHeight + 30;
  const height = foot + 58;
  const sheet = svg(width, height, `
    <rect width="${width}" height="${height}" fill="#0d1117"/>
    <rect x=".5" y=".5" width="${width - 1}" height="${height - 1}" rx="6" fill="#0d1117" stroke="#30363d"/>
    ${label('alkafeu / README.md', inset, 32, 12, { color: '#e6edf3' })}
    ${pngImage(render(profile(mobile, false)).asPng(), inset, top, contentWidth, profileHeight)}
    ${pngImage(contactPng('website', mobile), inset, firstRow, contentWidth / 2, contactHeight)}
    ${pngImage(contactPng('bot', mobile), width / 2, firstRow, contentWidth / 2, contactHeight)}
    ${pngImage(contactPng('telegram', mobile), inset, secondRow, contentWidth / 2, contactHeight)}
    ${pngImage(contactPng('github', mobile), width / 2, secondRow, contentWidth / 2, contactHeight)}
    ${label('Код проекта: StealthKitty', inset, foot, mobile ? 14 : 16, { color: '#58a6ff', weight: 450 })}
    ${label('Баннер StealthCat', inset + 18, foot + 32, mobile ? 14 : 16, { weight: 450 })}
    <path d="M${inset} ${foot + 22} L${inset + 6} ${foot + 26} L${inset} ${foot + 30}Z" fill="#e6edf3"/>
  `, 'Предпросмотр компактного профиля StealthCat.');
  writeFileSync(join(previews, mobile ? 'mobile.png' : 'preview.png'), render(sheet).asPng());
}
console.log('Built one responsive profile card and four contacts in an equal two-column grid. Desktop preview width: 898px; phone: 344px.');
