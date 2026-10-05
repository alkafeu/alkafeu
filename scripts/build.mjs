import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import gifenc from 'gifenc';
import { marked } from 'marked';

const { GIFEncoder, quantize, applyPalette } = gifenc;
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const assets = join(root, 'assets');
const previews = join(root, '.preview');
mkdirSync(assets, { recursive: true });
mkdirSync(previews, { recursive: true });

const fontFiles = [
  'C:/Windows/Fonts/segoeui.ttf',
  'C:/Windows/Fonts/segoeuib.ttf',
  'C:/Windows/Fonts/segoeuil.ttf',
  'C:/Windows/Fonts/consola.ttf',
  '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
  '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
  '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf',
].filter(existsSync);
const renderOptions = {
  font: { fontFiles, loadSystemFonts: true, defaultFontFamily: 'Segoe UI' },
};
const colors = {
  bg: '#111518', card: '#161c20', line: '#2b3638',
  mint: '#a7dfc4', white: '#eeeee7', muted: '#a0aaa8',
};
const esc = (s) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
const svg = (width, height, body, title = '') => `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img"><title>${esc(title)}</title>${body}</svg>`;
const text = (x, y, size, content, options = {}) => `<text x="${x}" y="${y}" fill="${options.fill || colors.white}" font-family="${options.mono ? 'Consolas, DejaVu Sans Mono, monospace' : 'Segoe UI, DejaVu Sans, sans-serif'}" font-size="${size}" font-weight="${options.weight || 400}"${options.spacing ? ` letter-spacing="${options.spacing}"` : ''}>${esc(content)}</text>`;
// Turn lettering into paths so the exported SVG does not need external fonts.
const outlines = (w, h, body) => new Resvg(svg(w, h, body), renderOptions).toString();
const png = (source) => new Resvg(source, renderOptions).render();
const save = (name, source) => writeFileSync(join(assets, name), source);
const embeddedImage = (name, width, height, x = 0, y = 0) => {
  const ext = name.endsWith('.png') ? 'png' : 'svg+xml';
  const data = readFileSync(join(assets, name)).toString('base64');
  return `<image x="${x}" y="${y}" width="${width}" height="${height}" href="data:image/${ext};base64,${data}"/>`;
};

function star(x, y, size, id, opacity = 0.8) {
  return `<g id="${id}" opacity="${opacity}" transform="translate(${x} ${y})"><path d="M0 ${-size} Q0 0 ${size} 0 Q0 0 0 ${size} Q0 0 ${-size} 0 Q0 0 0 ${-size}Z" fill="${colors.mint}"/></g>`;
}

function cat({ blink = 1, tail = 0, animate = false } = {}) {
  const tailX = 136 + tail;
  return `<g>
    <path d="M51 145 C125 168 ${tailX + 12} 130 ${tailX} 91 C${tailX - 5} 66 ${tailX - 33} 70 ${tailX - 31} 89" fill="none" stroke="#40584e" stroke-width="22" stroke-linecap="round"/>
    <ellipse cx="0" cy="126" rx="74" ry="76" fill="#1a2923" stroke="#40584e" stroke-width="2.5"/>
    <path d="M-74 38 C-100 8 -92 -40 -84 -89 L-45 -61 Q0 -79 45 -61 L84 -89 C98 -40 103 5 74 38 Q49 75 0 76 Q-49 75 -74 38Z" fill="#20352b" stroke="#668776" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M-77 -70 L-52 -52 L-76 -41Z M77 -70 L52 -52 L76 -41Z" fill="#52725f" opacity=".65"/>
    <path d="M-36 30 Q-31 37 -22 32 M22 32 Q31 37 36 30" fill="none" stroke="#627d6d" stroke-width="2.2" stroke-linecap="round"/>
    <g${animate ? ' id="cat-eyes"' : ''} transform="scale(1 ${Math.max(0.06, blink).toFixed(3)})">
      <ellipse cx="-32" cy="0" rx="13" ry="8" fill="${colors.mint}"/>
      <ellipse cx="32" cy="0" rx="13" ry="8" fill="${colors.mint}"/>
      <ellipse cx="-30" cy="0" rx="3" ry="7" fill="#15211b"/>
      <ellipse cx="34" cy="0" rx="3" ry="7" fill="#15211b"/>
      <circle cx="-35" cy="-3" r="1.8" fill="#fff8e8"/>
      <circle cx="29" cy="-3" r="1.8" fill="#fff8e8"/>
    </g>
    <path d="M-5 21 Q0 16 5 21 L0 26Z" fill="#b99bad"/>
    <path d="M0 26 V31 M0 31 Q-5 37 -10 32 M0 31 Q5 37 10 32" fill="none" stroke="#c7c8bb" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M-49 22 L-91 15 M-49 32 L-91 35 M49 22 L91 15 M49 32 L91 35" stroke="#8fa696" stroke-width="1.5" stroke-linecap="round" opacity=".7"/>
    <path d="M-33 118 Q-44 141 -44 178 Q-43 194 -28 194 Q-13 194 -14 178 V130 M33 118 Q44 141 44 178 Q43 194 28 194 Q13 194 14 178 V130" fill="#243a2e" stroke="#40584e" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M-32 186 V193 M-24 187 V193 M24 187 V193 M32 186 V193" stroke="#8da892" stroke-width="1.3" opacity=".6"/>
  </g>`;
}

const heroStyle = `<style>
  #floating-cat { animation: float 7s ease-in-out infinite; }
  #cat-eyes { transform-box: fill-box; transform-origin: center; animation: blink 8s infinite; }
  #star-a, #star-b, #star-c { animation: twinkle 6s ease-in-out infinite; }
  #star-b { animation-delay: -2s; } #star-c { animation-delay: -4s; }
  @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
  @keyframes blink { 0%,42%,46%,100% { transform: scaleY(1); } 44% { transform: scaleY(.08); } }
  @keyframes twinkle { 0%,100% { opacity: .35; } 50% { opacity: .85; } }
  @media (prefers-reduced-motion: reduce) { #floating-cat, #cat-eyes, #star-a, #star-b, #star-c { animation: none; } }
</style>`;

function hero(animated) {
  const heading = outlines(1200, 360,
    text(62, 73, 16, 'alkafeu / personal space', { mono: true, fill: colors.muted }) +
    text(57, 193, 91, 'ALKAFEU', { weight: 700, spacing: -3 }) +
    text(62, 239, 22, 'code. curiosity. cats.', { mono: true, fill: colors.mint }) +
    text(62, 315, 13, 'a little corner of the internet', { mono: true, fill: '#929f98' })
  );
  return svg(1200, 360, `${animated ? heroStyle : ''}
    <defs>
      <radialGradient id="aura"><stop stop-color="#365b46" stop-opacity=".26"/><stop offset="1" stop-color="#15211b" stop-opacity="0"/></radialGradient>
      <linearGradient id="edge" x2="1" y2="1"><stop stop-color="#405a4e"/><stop offset=".5" stop-color="#2a3634"/><stop offset="1" stop-color="#514350"/></linearGradient>
    </defs>
    <rect x="1" y="1" width="1198" height="358" rx="24" fill="${colors.bg}" stroke="url(#edge)" stroke-width="2"/>
    <ellipse cx="944" cy="171" rx="230" ry="191" fill="url(#aura)"/>
    <circle cx="938" cy="170" r="135" fill="none" stroke="#2e4135" stroke-width="1"/>
    <circle cx="938" cy="170" r="109" fill="none" stroke="#27362c" stroke-width="1" stroke-dasharray="3 10"/>
    <path d="M829 90 A135 135 0 0 1 1007 54" fill="none" stroke="#829d87" stroke-width="1.5" opacity=".55"/>
    <circle cx="1007" cy="54" r="3" fill="${colors.mint}"/>
    <ellipse cx="947" cy="327" rx="109" ry="7" fill="#243329" opacity=".6"/>
    <g transform="translate(928 145) scale(.9)"><g${animated ? ' id="floating-cat"' : ''}>${cat({ animate: animated })}</g></g>
    ${star(788, 86, 7, 'star-a')}${star(1103, 144, 6, 'star-b')}${star(796, 273, 4, 'star-c')}
    <circle cx="1074" cy="277" r="2" fill="#b3a3ba" opacity=".6"/>
    <circle cx="764" cy="189" r="1.8" fill="${colors.mint}" opacity=".5"/>
    <path d="M687 69 V289" stroke="#29332f" stroke-width="1" stroke-dasharray="2 9"/>
    ${heading}`, 'ALKAFEU — code, curiosity, cats. A mint-eyed cat under a quiet night sky.');
}
save('header.svg', hero(true));
save('header-static.svg', hero(false));

const projectLettering = outlines(1200, 230,
  text(54, 47, 13, '01 / MY PROJECT', { mono: true, spacing: 1.5, fill: colors.muted }) +
  text(54, 106, 40, 'StealthCat', { weight: 700 }) +
  text(54, 143, 20, 'VPN-сервис. Подключение через Telegram.', { fill: colors.muted }) +
  text(76, 194, 15, 'stealthcat.xyz', { mono: true, fill: colors.mint }) +
  text(279, 194, 15, '@stealthcatbot', { mono: true, fill: '#cbbace' })
);
save('stealthcat.svg', svg(1200, 230, `
  <rect x="1" y="1" width="1198" height="228" rx="20" fill="${colors.bg}" stroke="${colors.line}" stroke-width="2"/>
  <rect x="54" y="168" width="182" height="42" rx="21" fill="#1d2b24"/>
  <circle cx="63" cy="189" r="3" fill="${colors.mint}"/>
  <rect x="256" y="168" width="205" height="42" rx="21" fill="#29212c"/>
  <circle cx="267" cy="189" r="3" fill="#cbbace"/>
  <circle cx="1050" cy="117" r="67" fill="#192720" stroke="#344a3b"/>
  <g transform="translate(1050 99) scale(.38)">${cat()}</g>
  <path d="M1120 45 H1139 V64 M1118 66 L1138 46" fill="none" stroke="${colors.mint}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  ${projectLettering}`, 'StealthCat — VPN-сервис с подключением через Telegram. stealthcat.xyz / @stealthcatbot'));

function badge(name, label, width, kind, color = colors.mint) {
  const icons = {
    globe: '<circle cx="22" cy="22" r="8"/><path d="M14 22 H30 M22 14 C17 17 17 27 22 30 C27 27 27 17 22 14Z"/>',
    telegram: '<path d="M13 21 L31 14 L27 30 L21 25 L18 28 L18 23 L27 17 L20 22Z"/>',
    chat: '<path d="M15 15 H30 V25 H23 L18 30 V25 H15Z"/><path d="M19 19 H26 M19 22 H24"/>',
    code: '<path d="M19 16 L13 22 L19 28 M26 16 L32 22 L26 28 M24 14 L21 30"/>',
  };
  const body = `<rect x=".5" y=".5" width="${width - 1}" height="43" rx="12" fill="${colors.bg}" stroke="#364339"/><g fill="none" stroke="${color}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${icons[kind]}</g>${outlines(width, 44, text(42, 27, 14, label, { fill: color, weight: 600 }))}`;
  save(name, svg(width, 44, body, label));
}
badge('link-website.svg', 'Сайт StealthCat', 179, 'globe');
badge('link-bot.svg', 'Telegram-бот', 164, 'telegram');
badge('link-telegram.svg', '@alkafeu', 140, 'telegram', '#cbbace');
badge('link-github.svg', 'GitHub', 123, 'code');

const terminalLettering = outlines(760, 152,
  text(162, 44, 12, 'alkafeu@github:~', { mono: true, fill: colors.muted }) +
  text(162, 90, 20, 'make yourself at home.', { mono: true, fill: colors.mint }) +
  text(162, 120, 12, '// a quiet place to build things', { mono: true, fill: '#9ba6a1' })
);
function terminal(t = 0, moving = true) {
  const tau = 2 * Math.PI;
  const bounce = moving ? -1.4 * Math.sin(tau * t / 8) : 0;
  const d = Math.abs(t - 3.2);
  const blink = moving && d < .16 ? Math.max(.07, d / .16) : 1;
  const tail = moving ? 8 * Math.sin(tau * t / 8) : 0;
  const cursor = !moving || Math.floor(t / .75) % 2 === 0;
  return svg(760, 152, `
    <rect x="1" y="1" width="758" height="150" rx="18" fill="${colors.bg}" stroke="${colors.line}" stroke-width="2"/>
    <circle cx="706" cy="25" r="3" fill="#4b5b50"/>
    <circle cx="721" cy="25" r="3" fill="#4b5b50"/>
    <circle cx="736" cy="25" r="3" fill="#81998a"/>
    <path d="M137 29 V123" stroke="#2d3b32"/>
    <ellipse cx="79" cy="123" rx="38" ry="3" fill="#263c2f"/>
    <g transform="translate(71 ${61 + bounce}) scale(.305)">${cat({ blink, tail })}</g>
    ${terminalLettering}
    ${cursor ? `<rect x="431" y="75" width="9" height="20" rx="1.5" fill="${colors.mint}" opacity=".7"/>` : ''}`, 'make yourself at home. A gently blinking cat next to a terminal prompt.');
}

const firstFrame = png(terminal(0, false));
save('terminal-static.png', firstFrame.asPng());
const palette = quantize(firstFrame.pixels, 128);
const animation = GIFEncoder();
const frames = 120;
for (let i = 0; i < frames; i++) {
  const rendered = png(terminal(i * 8 / frames));
  animation.writeFrame(applyPalette(rendered.pixels, palette), rendered.width, rendered.height,
    { ...(i === 0 ? { palette } : {}), delay: i % 3 === 0 ? 60 : 70, repeat: 0 });
}
animation.finish();
save('terminal.gif', animation.bytes());

// The preview uses the actual README and assets; animation can be paused.
const readme = readFileSync(join(root, 'README.md'), 'utf8');
const preview = `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>alkafeu — GitHub profile preview</title><style>
  :root{color-scheme:dark;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#0d1117;color:#e6edf3}
  *{box-sizing:border-box}body{margin:0;padding:30px 20px 60px}.shell{max-width:1000px;margin:auto}.toolbar{display:flex;gap:16px;justify-content:space-between;align-items:center;margin-bottom:22px;color:#9fa8b1;font-size:13px}.toolbar a{color:#a7dfc4}button{font:inherit;background:#161c20;color:#c5dbc9;border:1px solid #364339;border-radius:8px;padding:8px 12px;cursor:pointer}.readme{border:1px solid #30363d;border-radius:12px;padding:28px 32px;line-height:1.65;font-size:16px;overflow-wrap:anywhere}.readme img{max-width:100%;height:auto;vertical-align:middle}.readme a{color:#a7dfc4;text-decoration:none}.readme a:hover{text-decoration:underline}.readme h3{font-size:23px;line-height:1.4;margin:20px 0 15px}.readme p{margin:14px 0}.readme sub{color:#9fa8b1}.readme .contacts{line-height:3.4}.meta{font:12px Consolas,monospace;margin:0 0 22px;color:#8b949e}.caption{color:#8b949e;text-align:center;font-size:12px;margin-top:18px}@media(max-width:600px){body{padding:15px 10px}.readme{padding:16px}.readme h3{font-size:20px}.toolbar{flex-wrap:wrap}.readme a img[height="44"]{height:38px;width:auto}}@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
  </style></head><body><div class="shell"><div class="toolbar"><span>Предпросмотр оформления · <a href="https://github.com/alkafeu">github.com/alkafeu</a></span><button type="button" id="motion" aria-pressed="false">Остановить анимацию</button></div><main class="readme"><div class="meta">alkafeu / README.md</div>${marked.parse(readme).replaceAll('assets/', '../assets/')}</main><p class="caption">Локальный предпросмотр. Ширина и интервалы на GitHub могут немного отличаться.</p></div><script>
  const toggle=document.getElementById('motion');const targets=[...document.querySelectorAll('picture img')];let paused=false;toggle.addEventListener('click',()=>{paused=!paused;for(const img of targets){if(!img.dataset.original)img.dataset.original=img.getAttribute('src');const source=img.closest('picture').querySelector('source');img.setAttribute('src',paused?source.getAttribute('srcset'):img.dataset.original)}toggle.textContent=paused?'Включить анимацию':'Остановить анимацию';toggle.setAttribute('aria-pressed',String(paused))});
  </script></body></html>`;
writeFileSync(join(previews, 'index.html'), preview);

// A shareable static contact sheet, built from the exact exported artwork.
const contactSheet = svg(1200, 1120, `
  <rect width="1200" height="1120" rx="16" fill="#0d1117"/>
  ${text(50, 41, 14, 'alkafeu / README.md', { mono: true, fill: '#8b949e' })}
  ${embeddedImage('header-static.svg', 1100, 330, 50, 68)}
  ${text(50, 458, 30, 'Привет, я alkafeu', { weight: 700 })}
  ${text(50, 504, 22, 'Развиваю StealthCat — VPN-сервис с подключением через Telegram.', { fill: '#d0d9d3' })}
  ${text(50, 540, 22, 'Работаю над ботом, веб-интерфейсами и инфраструктурой проекта.', { fill: '#d0d9d3' })}
  ${embeddedImage('stealthcat.svg', 1100, 211, 50, 586)}
  ${embeddedImage('link-website.svg', 179, 44, 50, 822)}
  ${embeddedImage('link-bot.svg', 164, 44, 241, 822)}
  ${embeddedImage('link-telegram.svg', 140, 44, 417, 822)}
  ${embeddedImage('link-github.svg', 123, 44, 569, 822)}
  ${text(50, 893, 15, 'Репозиторий проекта: StealthKitty ↗', { fill: '#8b949e' })}
  ${embeddedImage('terminal-static.png', 760, 152, 220, 914)}
  ${text(495, 1098, 13, 'code · curiosity · cats', { fill: '#8b949e' })}
`, 'Предпросмотр профиля ALKAFEU со StealthCat, контактами и кошачьим оформлением.');
writeFileSync(join(previews, 'preview.svg'), contactSheet);
writeFileSync(join(previews, 'preview.png'), png(contactSheet).asPng());
writeFileSync(join(previews, 'hero.png'), png(hero(false)).asPng());
console.log(`Built profile artwork and ${frames}-frame GIF. Preview: ${join(previews, 'index.html')}`);
