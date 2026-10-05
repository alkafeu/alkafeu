import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import { openSync } from 'fontkit';
import gifenc from 'gifenc';
import { marked } from 'marked';

const { GIFEncoder, quantize, applyPalette } = gifenc;
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const assets = join(root, 'assets');
const previews = join(root, '.preview');
mkdirSync(previews, { recursive: true });

// The site's actual typeface and color tokens. Original PNG artwork stays untouched.
const typeface = openSync(join(root, 'sources/Manrope.ttf'));
const fonts = new Map();
const colors = {
  bg: '#0e0c13', surface: '#17131f', line: '#342c40',
  text: '#faf7ff', muted: '#b9b2c4', quiet: '#a297b1', accent: '#c291ff',
};
const esc = (s) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
const svg = (width, height, body, title) => `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img"><title>${esc(title)}</title>${body}</svg>`;
const save = (name, source) => writeFileSync(join(assets, name), source);
const render = (source) => new Resvg(source, { font: { loadSystemFonts: false } }).render();

function lettering(content, x, y, size, { weight = 500, color = colors.text, spacing = 0 } = {}) {
  if (!fonts.has(weight)) fonts.set(weight, typeface.getVariation({ wght: weight }));
  const font = fonts.get(weight);
  const run = font.layout(content);
  const scale = size / font.unitsPerEm;
  let advance = 0;
  let paths = '';
  run.glyphs.forEach((glyph, i) => {
    if (glyph.id === 0) throw new Error(`Manrope has no glyph for ${content}`);
    const position = run.positions[i];
    const d = glyph.path.toSVG();
    if (d) paths += `<path transform="translate(${advance + position.xOffset} ${position.yOffset})" d="${d}"/>`;
    advance += position.xAdvance + spacing / scale;
  });
  return {
    body: `<g fill="${color}" transform="translate(${x} ${y}) scale(${scale} ${-scale})">${paths}</g>`,
    width: advance * scale - spacing,
  };
}
const label = (...args) => lettering(...args).body;
function image(name, width, height, x = 0, y = 0) {
  const mime = name.endsWith('.svg') ? 'image/svg+xml' : 'image/png';
  return `<image x="${x}" y="${y}" width="${width}" height="${height}" href="data:${mime};base64,${readFileSync(join(assets, name)).toString('base64')}"/>`;
}

const motionStyle = `<style>
  #brand-mark { animation: drift 8s ease-in-out infinite; }
  #brand-light { animation: breathe 8s ease-in-out infinite; }
  @keyframes drift { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
  @keyframes breathe { 0%,100% { opacity: .18; } 50% { opacity: .25; } }
  @media (prefers-reduced-motion: reduce) { #brand-mark, #brand-light { animation: none; } }
</style>`;

function hero(animated) {
  const name = lettering('alkafeu', 62, 177, 110, { weight: 650, spacing: -4.2 });
  return svg(1200, 340, `${animated ? motionStyle : ''}
    <defs>
      <linearGradient id="surface" x2="1" y2="1"><stop stop-color="#18141f"/><stop offset="1" stop-color="${colors.bg}"/></linearGradient>
      <radialGradient id="violet-light"><stop stop-color="#7738bd"/><stop offset="1" stop-color="#7738bd" stop-opacity="0"/></radialGradient>
    </defs>
    <rect width="1200" height="340" rx="12" fill="url(#surface)"/>
    <path d="M62 56 H86" stroke="${colors.accent}" stroke-width="1.5"/>
    ${label('STEALTHCAT', 100, 60, 12, { weight: 650, spacing: 1.8, color: '#c5acdf' })}
    ${name.body}
    ${label('.', 62 + name.width - 1, 177, 110, { weight: 650, color: colors.accent })}
    ${label('Бот. Веб. Инфраструктура.', 65, 231, 25, { weight: 450, color: colors.muted })}
    ${label('Создаю и развиваю StealthCat', 65, 295, 15, { weight: 550, color: colors.accent })}
    <ellipse${animated ? ' id="brand-light"' : ''} cx="966" cy="180" rx="192" ry="150" fill="url(#violet-light)" opacity=".18"/>
    <g${animated ? ' id="brand-mark"' : ''}>${image('stealthcat-logo.png', 295, 295, 820, 20)}</g>
  `, 'alkafeu. Создаю и развиваю StealthCat. Оригинальный логотип StealthCat.');
}
save('profile-hero.svg', hero(true));
save('profile-hero-static.svg', hero(false));

function contact(name, text, width, color = colors.text) {
  const arrow = `<path d="M${width - 26} 15 H${width - 18} V23 M${width - 27} 24 L${width - 18} 15" fill="none" stroke="${colors.accent}" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"/>`;
  save(name, svg(width, 40,
    `<rect x=".5" y=".5" width="${width - 1}" height="39" rx="7" fill="${colors.surface}" stroke="${colors.line}"/>` +
    label(text, 15, 25, 13, { weight: 550, color }) + arrow, text));
}
contact('contact-website.svg', 'stealthcat.xyz', 163);
contact('contact-bot.svg', '@stealthcatbot', 176);
contact('contact-telegram.svg', 'Telegram · @alkafeu', 207, '#dfc7fa');
contact('contact-github.svg', 'GitHub', 111);

// A small, unobtrusive GIF: a slow violet highlight on the site's closing line.
// It is code-native artwork; the supplied logos are not modified.
const signatureText = label('Всегда под лапой.', 1060, 42, 12, { weight: 500, color: colors.quiet });
function signature(t = 0) {
  const phase = .5 - .5 * Math.cos(t * 2 * Math.PI / 8);
  const position = 85 + 300 * phase;
  return svg(1200, 64, `
    <defs><linearGradient id="sheen"><stop stop-color="${colors.accent}" stop-opacity="0"/><stop offset=".5" stop-color="${colors.accent}" stop-opacity=".62"/><stop offset="1" stop-color="${colors.accent}" stop-opacity="0"/></linearGradient></defs>
    <rect width="1200" height="64" fill="${colors.bg}"/>
    <path d="M0 8 H1200" stroke="${colors.line}"/>
    <rect x="${position}" y="7.5" width="155" height="1" fill="url(#sheen)"/>
    ${label('stealthcat', 0, 42, 14, { weight: 650 })}
    ${label('.', 64.5, 42, 14, { weight: 650, color: colors.accent })}
    ${signatureText}
  `, 'StealthCat. Всегда под лапой.');
}
const first = render(signature(0));
save('signature-static.png', first.asPng());
const palette = quantize(first.pixels, 128);
const gif = GIFEncoder();
const frames = 64;
for (let i = 0; i < frames; i++) {
  const frame = render(signature(8 * i / frames));
  gif.writeFrame(applyPalette(frame.pixels, palette), frame.width, frame.height,
    { ...(i === 0 ? { palette } : {}), delay: i % 2 === 0 ? 120 : 130, repeat: 0 });
}
gif.finish();
save('signature.gif', gif.bytes());

const readme = readFileSync(join(root, 'README.md'), 'utf8');
const preview = `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>alkafeu · StealthCat</title><style>
  @font-face{font-family:Manrope;src:url('../sources/Manrope.ttf') format('truetype');font-weight:200 800;font-display:swap}
  :root{color-scheme:dark;background:#0d1117;color:#e6edf3;font-family:Manrope,Arial,sans-serif}*{box-sizing:border-box}body{margin:0;padding:28px 20px 60px}.shell{max-width:1000px;margin:auto}.toolbar{display:flex;justify-content:space-between;align-items:center;gap:20px;color:#a297b1;font-size:12px;margin-bottom:20px}.toolbar a{color:#c291ff}button{font:inherit;color:#dfc7fa;background:#17131f;border:1px solid #342c40;border-radius:7px;padding:8px 12px;cursor:pointer}.readme{border:1px solid #30363d;border-radius:12px;padding:30px;line-height:1.8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:16px}.readme img{max-width:100%;height:auto;vertical-align:middle}.readme p{margin:16px 0}.readme a{color:#c291ff;text-decoration:none}.readme a:hover{text-decoration:underline}.readme sub{color:#a297b1}.meta{font-size:12px;color:#8b949e;margin-bottom:23px}.caption{font-size:11px;text-align:center;color:#8b949e;margin-top:18px}@media(max-width:600px){body{padding:14px 10px}.readme{padding:14px}.toolbar{flex-wrap:wrap}.readme p{font-size:14px}}
  </style></head><body><div class="shell"><div class="toolbar"><span><a href="https://github.com/alkafeu">alkafeu</a> · оформление StealthCat</span><button type="button" id="motion" aria-pressed="false">Остановить анимацию</button></div><main class="readme"><div class="meta">alkafeu / README.md</div>${marked.parse(readme).replaceAll('assets/', '../assets/')}</main><p class="caption">Предпросмотр README. Оба изображения — твои оригиналы.</p></div><script>
  let paused=false;const button=document.getElementById('motion');button.addEventListener('click',()=>{paused=!paused;document.querySelectorAll('picture img').forEach(img=>{if(!img.dataset.original)img.dataset.original=img.getAttribute('src');img.setAttribute('src',paused?img.closest('picture').querySelector('source').getAttribute('srcset'):img.dataset.original)});button.textContent=paused?'Включить анимацию':'Остановить анимацию';button.setAttribute('aria-pressed',String(paused))});
  </script></body></html>`;
writeFileSync(join(previews, 'index.html'), preview);

const heroPng = render(hero(false)).asPng();
const sheet = svg(1200, 1100, `
  <rect width="1200" height="1100" fill="#0d1117"/>
  <rect x="20" y="20" width="1160" height="1060" rx="12" fill="#0d1117" stroke="#30363d"/>
  ${label('alkafeu / README.md', 50, 53, 12, { color: '#8b949e' })}
  <image x="50" y="80" width="1100" height="311.67" href="data:image/png;base64,${heroPng.toString('base64')}"/>
  ${label('Развиваю StealthCat — VPN-сервис с подключением через Telegram.', 50, 456, 22, { color: '#e6edf3', weight: 450 })}
  ${label('Работаю над ботом, веб-интерфейсами и инфраструктурой проекта.', 50, 493, 22, { color: '#e6edf3', weight: 450 })}
  ${image('stealthcat-banner.png', 1100, 366.85, 50, 538)}
  ${image('contact-website.svg', 163, 40, 50, 935)}
  ${image('contact-bot.svg', 176, 40, 223, 935)}
  ${image('contact-telegram.svg', 207, 40, 409, 935)}
  ${image('contact-github.svg', 111, 40, 626, 935)}
  ${label('Репозиторий проекта: StealthKitty', 50, 1008, 13, { color: '#a297b1' })}
  ${image('signature-static.png', 1100, 58.67, 50, 1021)}
`, 'Профиль alkafeu в фирменном стиле StealthCat.');
writeFileSync(join(previews, 'preview.svg'), sheet);
writeFileSync(join(previews, 'preview.png'), render(sheet).asPng());
writeFileSync(join(previews, 'hero.png'), heroPng);
console.log('Built StealthCat profile with original PNG artwork, Manrope lettering and quiet violet motion.');
