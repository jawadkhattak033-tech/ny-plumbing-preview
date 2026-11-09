/**
 * Builds every site image as WebP width variants in public/images/photos/
 * and writes src/data/image-manifest.json for the <Img> component.
 *
 * - If src/assets/photos/<key>.(jpg|jpeg|png|webp) exists, that real photo is
 *   resized. Otherwise a labeled placeholder is drawn.
 * - Also writes the Open Graph image and favicons from business.json.
 * - Skips work when nothing changed, so it is cheap to run before every build.
 *
 * Run: npm run images
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const P = (...x) => path.join(ROOT, ...x);
const OUT = P('public/images/photos');
const SRC = P('src/assets/photos');
const MANIFEST = P('src/data/image-manifest.json');
const WIDTHS = [480, 800, 1200, 1920];
const DEFAULT_RATIO = [16, 10];

const business = JSON.parse(fs.readFileSync(P('src/data/business.json'), 'utf8'));
const fixed = JSON.parse(fs.readFileSync(P('src/data/images.json'), 'utf8'));
delete fixed._readme;

/* Collect every image key the site uses. */
const images = { ...fixed };
const auto = [
  ['services', 'service', 'title'],
  ['commercial', 'commercial', 'title'],
  ['regions', 'region', 'name'],
  ['towns', 'town', 'name'],
];
for (const [dir, prefix, field] of auto) {
  const d = P('src/content', dir);
  if (!fs.existsSync(d)) continue;
  for (const f of fs.readdirSync(d).filter((x) => x.endsWith('.json'))) {
    const slug = f.replace(/\.json$/, '');
    let label = slug;
    try { label = JSON.parse(fs.readFileSync(path.join(d, f), 'utf8'))[field] || slug; } catch { /* keep slug */ }
    if (prefix === 'town') label = `${label}, ${business.address.state}`;
    images[`${prefix}-${slug}`] = { label, ratio: DEFAULT_RATIO, kind: prefix };
  }
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const PALETTES = [
  ['#0a2a66', '#1565d8'],
  ['#061a42', '#0a2a66'],
  ['#12356f', '#2b8af0'],
  ['#0d2350', '#3a5f9e'],
];

/** Word-wrap a label into lines that fit roughly `max` characters. */
function wrap(text, max) {
  const words = text.split(/\s+/); const lines = []; let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > max) { if (cur) lines.push(cur); cur = w; } else cur = (cur + ' ' + w).trim();
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 4);
}

/** Quiet placeholder for full-bleed heroes: navy gradient, small corner caption. */
function subtleSvg(label, w, h) {
  const fsz = Math.max(11, Math.round(w * 0.0075));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#061a42"/><stop offset=".55" stop-color="#0a2a66"/><stop offset="1" stop-color="#14408a"/></linearGradient>
    <radialGradient id="r" cx=".78" cy=".35" r=".6"><stop offset="0" stop-color="#2b8af0" stop-opacity=".22"/><stop offset="1" stop-color="#2b8af0" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <rect width="100%" height="100%" fill="url(#r)"/>
  <text x="${Math.round(w * 0.9)}" y="${Math.round(h * 0.86)}" text-anchor="end" font-family="Helvetica, Arial, sans-serif" font-size="${fsz}" fill="#c9d6ee" fill-opacity=".55">Placeholder photo: ${esc(label)}</text>
</svg>`;
}

function placeholderSvg(key, label, w, h) {
  const n = parseInt(crypto.createHash('md5').update(key).digest('hex').slice(0, 2), 16);
  const [c1, c2] = PALETTES[n % PALETTES.length];
  /* Landscape images double as hero backgrounds, where copy sits on the left,
     so their label goes bottom-right. Portrait/square labels stay centered. */
  const wide = w > h * 1.2;
  const fs1 = Math.round(Math.min(w, h) * (wide ? 0.06 : 0.075));
  const lines = wrap(label, Math.max(12, Math.round((wide ? w * 0.38 : w) / (fs1 * 0.56))));
  const lh = fs1 * 1.25;
  const tag = Math.round(fs1 * (wide ? 0.5 : 0.42));
  const startY = wide ? h / 2 - ((lines.length - 1) * lh) / 2 + fs1 * 0.35 : h / 2 - ((lines.length - 1) * lh) / 2 + fs1 * 0.35;
  const x = wide ? w * 0.88 : w / 2;
  const anchor = wide ? 'end' : 'middle';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>
    <pattern id="p" width="${Math.round(w / 12)}" height="${Math.round(w / 12)}" patternUnits="userSpaceOnUse"><path d="M0 ${Math.round(w / 24)}h${Math.round(w / 12)}" stroke="#ffffff" stroke-opacity=".05" stroke-width="${Math.max(2, Math.round(w / 200))}"/></pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <rect width="100%" height="100%" fill="url(#p)"/>
  <rect x="${w * 0.04}" y="${h * 0.05}" width="${w * 0.92}" height="${h * 0.9}" rx="${fs1 * 0.4}" fill="none" stroke="#ffffff" stroke-opacity=".28" stroke-width="${Math.max(2, w / 400)}" stroke-dasharray="${fs1 * 0.5} ${fs1 * 0.35}"/>
  <text x="${wide ? x : w / 2}" y="${wide ? startY - fs1 * 1.3 : h * 0.05 + tag * 2.6}" text-anchor="${anchor}" font-family="Helvetica, Arial, sans-serif" font-size="${tag}" font-weight="700" letter-spacing="${tag * 0.18}" fill="#ff8a8f">PLACEHOLDER PHOTO</text>
  ${lines.map((l, i) => `<text x="${x}" y="${startY + i * lh}" text-anchor="${anchor}" font-family="Helvetica, Arial, sans-serif" font-size="${fs1}" font-weight="700" fill="#ffffff">${esc(l)}</text>`).join('\n  ')}
  <text x="${x}" y="${h * 0.95 - tag * 1.6}" text-anchor="${anchor}" font-family="Helvetica, Arial, sans-serif" font-size="${tag}" fill="#c9d6ee">${esc(key)}  ·  ${w}×${h}</text>
</svg>`;
}

function findSource(key) {
  for (const ext of ['jpg', 'jpeg', 'png', 'webp']) {
    const f = path.join(SRC, `${key}.${ext}`);
    if (fs.existsSync(f)) return f;
  }
  return null;
}

fs.mkdirSync(OUT, { recursive: true });
const old = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, 'utf8')) : {};
const manifest = {};
let made = 0;

for (const [key, def] of Object.entries(images)) {
  const src = findSource(key);
  const [rw, rh] = def.ratio || DEFAULT_RATIO;
  const sig = src
    ? `photo:${fs.statSync(src).mtimeMs}`
    : `ph:${def.label}:${rw}x${rh}:${def.style || 'std'}:v4`;

  let maxW, maxH, input;
  if (src) {
    const meta = await sharp(src).metadata();
    maxW = Math.min(meta.width, 1920); maxH = Math.round((meta.height / meta.width) * maxW);
    input = () => sharp(src).rotate();
  } else {
    maxW = rw < rh ? 1200 : 1920; maxH = Math.round((maxW * rh) / rw);
  }
  const widths = WIDTHS.filter((w) => w < maxW).concat(maxW);
  const files = widths.map((w) => path.join(OUT, `${key}-${w}.webp`));
  const entry = { w: maxW, h: maxH, widths, sig };

  if (old[key]?.sig === sig && files.every((f) => fs.existsSync(f))) { manifest[key] = old[key]; continue; }

  for (const w of widths) {
    const h = Math.round((maxH * w) / maxW);
    const svg = def.style === 'subtle' ? subtleSvg(def.label, w, h) : placeholderSvg(key, def.label, w, h);
    const pipe = src ? input().resize(w, h, { fit: 'cover' }) : sharp(Buffer.from(svg));
    await pipe.webp({ quality: src ? 74 : 62, effort: 5 }).toFile(path.join(OUT, `${key}-${w}.webp`));
  }
  manifest[key] = entry; made++;
}

/* Remove variants for images that no longer exist. */
for (const f of fs.readdirSync(OUT)) {
  const key = f.replace(/-\d+\.webp$/, '');
  if (!manifest[key]) fs.unlinkSync(path.join(OUT, f));
}
fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');

/* ---------- Open Graph image and favicons, from business.json ---------- */
const brandSig = `${business.name}|${business.initials}|${business.phone}|v2`;
const brandStamp = P('public/images/.brand-sig');
if (!fs.existsSync(brandStamp) || fs.readFileSync(brandStamp, 'utf8') !== brandSig) {
  fs.mkdirSync(P('public/images/logo'), { recursive: true });
  const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#061a42"/><stop offset="1" stop-color="#1565d8"/></linearGradient></defs>
    <rect width="1200" height="630" fill="url(#g)"/>
    <rect x="80" y="210" width="14" height="210" fill="#e1262e"/>
    <text x="120" y="290" font-family="Helvetica, Arial, sans-serif" font-size="64" font-weight="800" fill="#fff">${esc(business.name)}</text>
    <text x="120" y="360" font-family="Helvetica, Arial, sans-serif" font-size="34" fill="#dbe6f8">24/7 plumbing and drain cleaning, ${esc(business.address.city)}, ${esc(business.address.state)}</text>
    <text x="120" y="415" font-family="Helvetica, Arial, sans-serif" font-size="34" font-weight="700" fill="#ff8a8f">${esc(business.phone)}</text>
  </svg>`;
  await sharp(Buffer.from(og)).jpeg({ quality: 82 }).toFile(P('public/images/og-share.jpg'));

  const icon = (s) => `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 64 64">
    <rect width="64" height="64" rx="14" fill="#0a2a66"/>
    <path d="M32 11c-7 9.5-14 18.4-14 27a14 14 0 0 0 28 0c0-8.6-7-17.5-14-27z" fill="#e1262e"/>
    <path d="M26 39a6 6 0 0 0 6 6" stroke="#fff" stroke-width="3.5" stroke-linecap="round" fill="none"/>
  </svg>`;
  fs.writeFileSync(P('public/favicon.svg'), icon(64));
  await sharp(Buffer.from(icon(32))).png().toFile(P('public/images/logo/favicon-32.png'));
  await sharp(Buffer.from(icon(180))).png().toFile(P('public/images/logo/apple-touch-icon.png'));
  await sharp(Buffer.from(icon(48))).png().toFile(P('public/favicon.ico'));
  fs.writeFileSync(brandStamp, brandSig);
  made++;
}

console.log(`[images] ${Object.keys(manifest).length} images in manifest, ${made} (re)generated.`);
