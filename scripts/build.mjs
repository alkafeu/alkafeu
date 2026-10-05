import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import { create, openSync } from 'fontkit';
import wawoff2 from 'wawoff2';
import { marked } from 'marked';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const assets = join(root, 'assets');
const previews = join(root, '.preview');
mkdirSync(previews, { recursive: true });
const typeface = openSync(join(root, 'sources/Manrope.ttf'));
const siteBrandTypeface = create(Buffer.from(await wawoff2.decompress(readFileSync(join(root, 'sources/Manrope-site-latin.woff2')))));
const fonts = new Map();
const colors = { text: '#faf7ff', muted: '#b9b2c4', accent: '#c291ff' };
const esc = (s) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
const svg = (width, height, body, title) => `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img"><title>${esc(title)}</title>${body}</svg>`;
const save = (name, source) => writeFileSync(join(assets, name), source);
const render = (source) => new Resvg(source, { font: { loadSystemFonts: false } }).render();

function lettering(content, x, y, size, { weight = 500, color = colors.text, spacing = 0, siteBrand = false, accentDot = false } = {}) {
  const fontKey = `${siteBrand ? 'site' : 'body'}-${weight}`;
  if (!fonts.has(fontKey)) fonts.set(fontKey, (siteBrand ? siteBrandTypeface : typeface).getVariation({ wght: weight }));
  const font = fonts.get(fontKey);
  const run = font.layout(content);
  const scale = size / font.unitsPerEm;
  let advance = 0;
  let paths = '';
  run.glyphs.forEach((glyph, i) => {
    if (glyph.id === 0) throw new Error(`Manrope has no glyph for ${content}`);
    const p = run.positions[i];
    const d = glyph.path.toSVG();
    if (d) paths += `<path${accentDot && glyph.codePoints.includes(46) ? ` fill="${colors.accent}"` : ''} transform="translate(${advance + p.xOffset} ${p.yOffset})" d="${d}"/>`;
    advance += p.xAdvance + spacing / scale;
  });
  return { body: `<g fill="${color}" transform="translate(${x} ${y}) scale(${scale} ${-scale})">${paths}</g>`, width: advance * scale - spacing };
}
const label = (...args) => lettering(...args).body;
const logoBytes = readFileSync(join(assets, 'stealthcat-logo.png'));
const logo = (x, y, size) => `<image x="${x}" y="${y}" width="${size}" height="${size}" href="data:image/png;base64,${logoBytes.toString('base64')}"/>`;
const pngImage = (data, x, y, width, height) => `<image x="${x}" y="${y}" width="${width}" height="${height}" href="data:image/png;base64,${data.toString('base64')}"/>`;

const motion = `<style>
  #brand-mark { animation: drift 9s ease-in-out infinite; }
  #brand-light { animation: breathe 9s ease-in-out infinite; }
  @keyframes drift { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-2px); } }
  @keyframes breathe { 0%,100% { opacity: .08; } 50% { opacity: .16; } }
  @media (prefers-reduced-motion: reduce) { #brand-mark, #brand-light { animation: none; } }
</style>`;

function identity(mobile = false, animated = true) {
  const width = mobile ? 480 : 960;
  const height = mobile ? 324 : 306;
  const nameY = mobile ? 94 : 105;
  const nameSize = mobile ? 76 : 96;
  // Match .brand on stealthcat.xyz: Manrope 750, -1.1px tracking at 23px.
  const name = lettering('alkafeu.', 0, nameY, nameSize, { weight: 750, spacing: -nameSize * 1.1 / 23, siteBrand: true, accentDot: true });
  const mark = mobile ? { x: 378, y: 12, size: 96 } : { x: 742, y: 36, size: 188 };
  const description = mobile
    ? label('VPN для твоих', 0, 220, 28, { weight: 450, color: colors.muted }) +
      label('повседневных планов.', 0, 259, 28, { weight: 450, color: colors.muted })
    : label('VPN для твоих повседневных планов.', 0, 238, 25, { weight: 450, color: colors.muted });
  const project = label('Мой проект — StealthCat.', 0, mobile ? 162 : 184, mobile ? 31 : 34, { weight: 500, color: colors.accent });
  return svg(width, height, `${animated ? motion : ''}
    <defs><radialGradient id="violet-light"><stop stop-color="#7738bd"/><stop offset="1" stop-color="#7738bd" stop-opacity="0"/></radialGradient></defs>
    <ellipse${animated ? ' id="brand-light"' : ''} cx="${mark.x + mark.size / 2}" cy="${mark.y + mark.size / 2}" rx="${mark.size * .61}" ry="${mark.size * .6}" fill="url(#violet-light)" opacity=".08"/>
    ${name.body}
    ${project}${description}
    <g${animated ? ' id="brand-mark"' : ''}>${logo(mark.x, mark.y, mark.size)}</g>
  `, 'alkafeu. Мой проект — StealthCat. VPN для твоих повседневных планов.');
}
for (const mobile of [false, true]) for (const animated of [false, true]) {
  save(`identity${mobile ? '-mobile' : ''}${animated ? '' : '-static'}.svg`, identity(mobile, animated));
}

// Plain typographic navigation. Transparent assets, no button backgrounds or borders.
const navLabels = { website: 'stealthcat.xyz', bot: '@stealthcatbot', telegram: '@alkafeu', github: 'GitHub' };
const navWidths = {};
for (const [key, content] of Object.entries(navLabels)) {
  const letteringResult = lettering(content, 0, 23, 21, { weight: 500, color: colors.accent, siteBrand: true });
  const width = Math.ceil(letteringResult.width + (key === 'github' ? 0 : 27));
  navWidths[key] = width;
  save(`nav-${key}.svg`, svg(width, 30, letteringResult.body, content));
}

const readme = readFileSync(join(root, 'README.md'), 'utf8');
const preview = `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>alkafeu · StealthCat</title><style>
  :root{color-scheme:dark;background:#0d1117;color:#e6edf3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}*{box-sizing:border-box}body{margin:0;padding:24px}.readme{max-width:898px;margin:auto;padding:24px;border:1px solid #30363d;border-radius:6px;font-size:16px;line-height:1.5}.readme img{max-width:100%;height:auto;vertical-align:middle}.readme a{color:#c291ff;text-decoration:none}.readme p{margin:24px 0 8px}.meta{color:#e6edf3;font-size:12px;margin-bottom:24px}.toolbar{max-width:898px;margin:0 auto 18px;display:flex;justify-content:space-between;align-items:center;color:#8b949e;font-size:12px;gap:20px}button{font:inherit;color:#c291ff;background:transparent;border:1px solid #30363d;border-radius:6px;padding:7px 12px;cursor:pointer}.caption{color:#8b949e;font-size:12px;text-align:center;margin-top:18px}@media(max-width:600px){body{padding:10px}.readme{padding:14px}}
  </style></head><body><div class="toolbar"><span>Предпросмотр профиля</span><button type="button" id="motion" aria-pressed="false">Остановить анимацию</button></div><main class="readme"><div class="meta">alkafeu / README.md</div>${marked.parse(readme).replaceAll('assets/', '../assets/')}</main><p class="caption">Крупная типографика, свободное пространство и оригинальный логотип StealthCat.</p><script>
  const button=document.getElementById('motion');let paused=false;button.addEventListener('click',()=>{paused=!paused;const hero=document.querySelector('main > picture');hero.querySelectorAll('source').forEach(source=>{if(!source.dataset.original)source.dataset.original=source.getAttribute('srcset');source.setAttribute('srcset',paused?source.dataset.original.replace(/(?<!-static)\\.svg$/,'-static.svg'):source.dataset.original)});const img=hero.querySelector('img');if(!img.dataset.original)img.dataset.original=img.getAttribute('src');img.setAttribute('src',paused?img.dataset.original.replace('.svg','-static.svg'):img.dataset.original);button.textContent=paused?'Включить анимацию':'Остановить анимацию';button.setAttribute('aria-pressed',String(paused))});
  </script></body></html>`;
writeFileSync(join(previews, 'index.html'), preview);

for (const mobile of [false, true]) {
  const width = mobile ? 344 : 898;
  const inset = mobile ? 14 : 24;
  const contentWidth = width - 2 * inset;
  const identityHeight = (mobile ? 324 / 480 : 306 / 960) * contentWidth;
  const top = 62;
  const navigationY = top + identityHeight + 26;
  const linkScale = 26 / 30;
  let x = inset;
  let y = navigationY;
  let navigation = '';
  for (const key of Object.keys(navLabels)) {
    const linkWidth = navWidths[key] * linkScale;
    if (x + linkWidth > width - inset + 1) { x = inset; y += 36; }
    navigation += pngImage(render(readFileSync(join(assets, `nav-${key}.svg`))).asPng(), x, y, linkWidth, 26);
    x += linkWidth + 4;
  }
  const height = y + 26 + 30;
  const sheet = svg(width, height, `
    <rect width="${width}" height="${height}" fill="#0d1117"/>
    <rect x=".5" y=".5" width="${width - 1}" height="${height - 1}" rx="6" fill="#0d1117" stroke="#30363d"/>
    ${label('alkafeu / README.md', inset, 32, 12, { color: '#e6edf3' })}
    ${pngImage(render(identity(mobile, false)).asPng(), inset, top, contentWidth, identityHeight)}
    ${navigation}
  `, 'Профиль alkafeu: StealthCat, крупная типографика и простые ссылки.');
  writeFileSync(join(previews, mobile ? 'mobile.png' : 'preview.png'), render(sheet).asPng());
}
console.log('Built transparent StealthCat identity, short project copy and plain text navigation.');
