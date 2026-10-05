import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const readme = readFileSync(join(root, 'README.md'), 'utf8');
const localImages = [...readme.matchAll(/(?:src|srcset)="(assets\/[^" ]+)"/g)].map(m => m[1]);
if (localImages.length < 8) throw new Error('Expected the responsive branded profile, contacts and static alternatives.');
for (const image of new Set(localImages)) {
  const path = join(root, image);
  if (!existsSync(path)) throw new Error(`Missing README image: ${image}`);
  if (image.endsWith('.svg')) {
    const body = readFileSync(path, 'utf8');
    if (/<(?:script|foreignObject)\b|(?:href|src)="https?:|<text\b/i.test(body)) {
      throw new Error(`SVG must have outlined text and no scripts or external resources: ${image}`);
    }
    const rendered = new Resvg(body).render();
    if (!rendered.width || !rendered.height) throw new Error(`Empty SVG: ${image}`);
  }
}
const originalHashes = {
  'stealthcat-logo.png': '35ebd73172697e631a9cb44a423a093c78d697550a1d912a842b2ce28563899a',
  'stealthcat-banner.png': 'b62e22376e1b75b359017becd2762f76994232c8cee1987bc095d8c11f4ff28d',
};
for (const [name, expected] of Object.entries(originalHashes)) {
  const actual = createHash('sha256').update(readFileSync(join(root, 'assets', name))).digest('hex');
  if (actual !== expected) throw new Error(`Supplied original changed: ${name}`);
}
const hero = readFileSync(join(root, 'assets/profile.svg'), 'utf8');
const embeddedLogo = hero.match(/href="data:image\/png;base64,([^"\s]+)"/);
if (!embeddedLogo || createHash('sha256').update(Buffer.from(embeddedLogo[1], 'base64')).digest('hex') !== originalHashes['stealthcat-logo.png']) throw new Error('Hero must embed the exact supplied logo.');
const heroRaster = new Resvg(hero).render();
const heroPixels = heroRaster.pixels;
let visibleLogoPixels = 0;
for (let y = 40; y < 245; y++) {
  for (let x = 640; x < 855; x++) {
    const offset = (y * heroRaster.width + x) * 4;
    if (heroPixels[offset] > 130 && heroPixels[offset + 2] > 160) visibleLogoPixels++;
  }
}
if (visibleLogoPixels < 3000) throw new Error('Logo is not visible in the rendered hero.');
if (heroRaster.width !== 900 || heroRaster.height !== 306) throw new Error('Desktop card dimensions are unexpected.');
const mobile = readFileSync(join(root, 'assets/profile-mobile.svg'), 'utf8');
const mobileRaster = new Resvg(mobile).render();
if (mobileRaster.width !== 480 || mobileRaster.height !== 380) throw new Error('Phone card dimensions are unexpected.');
if (!readme.includes('(max-width: 600px)')) throw new Error('Phone artwork must be selected by a picture source.');
if ([...readme.matchAll(/width="50%"/g)].length !== 4) throw new Error('Expected four contacts in two equal columns.');
if (readme.includes('<sub>') || readme.includes('signature.gif')) throw new Error('Avoid the previous tiny captions and duplicate footer.');
for (const contact of ['https://github.com/alkafeu', 'https://stealthcat.xyz/', 'https://t.me/stealthcatbot', 'https://t.me/alkafeu']) {
  if (!readme.includes(`href="${contact}"`)) throw new Error(`Missing selected contact: ${contact}`);
}
if (/TODO|YOUR_USERNAME|example\.com|168\.113\.|195\.63\.|2914\d|PRIVATE KEY|gh[pousr]_[A-Za-z0-9]{16}/i.test(readme)) throw new Error('Placeholder or private server data in profile.');
if (!readme.includes('prefers-reduced-motion: reduce')) throw new Error('Static alternatives must be available.');
console.log(`Verified ${new Set(localImages).size} image references, original artwork hashes, desktop/mobile cards and equal contact columns.`);
