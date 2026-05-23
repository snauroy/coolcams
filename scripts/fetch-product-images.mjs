/**
 * Fetch high-quality product photos via DuckDuckGo Image Search.
 * Downloads the best product photo for each camera.
 *
 * Usage:
 *   node scripts/fetch-product-images.mjs           # skip cached
 *   node scripts/fetch-product-images.mjs --force   # re-download all
 *   node scripts/fetch-product-images.mjs --id leica-m-a  # single camera
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname   = path.dirname(fileURLToPath(import.meta.url));
const CAMERAS_PATH = path.join(__dirname, '../data/cameras.json');
const OUTPUT_DIR   = path.join(__dirname, '../public/cameras');
const FORCE        = process.argv.includes('--force');
const SINGLE_ID    = process.argv.includes('--id')
  ? process.argv[process.argv.indexOf('--id') + 1]
  : null;

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
const cameras = JSON.parse(fs.readFileSync(CAMERAS_PATH, 'utf-8'));

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const sleep = ms => new Promise(r => setTimeout(r, ms));

// Better search terms for specific cameras
const SEARCH_TERMS = {
  'contax-t2':         'Contax T2 35mm film camera product',
  'contax-t3':         'Contax T3 35mm film camera product',
  'yashica-t4':        'Yashica T4 35mm compact film camera',
  'olympus-mju-ii':    'Olympus mju II Stylus Epic compact camera',
  'ricoh-gr1s':        'Ricoh GR1s compact film camera product',
  'minolta-tc1':       'Minolta TC-1 compact film camera product',
  'nikon-35ti':        'Nikon 35Ti titanium compact film camera',
  'leica-minilux':     'Leica Minilux compact film camera',
  'fujifilm-klasse':   'Fujifilm Klasse W compact film camera',
  'konica-hexar-af':   'Konica Hexar AF 35mm film camera',
  'leica-m6':          'Leica M6 rangefinder film camera product',
  'leica-m3':          'Leica M3 rangefinder camera product photo',
  'leica-m4':          'Leica M4 rangefinder film camera',
  'leica-m-a':         'Leica M-A Typ 127 film rangefinder camera',
  'leica-m7':          'Leica M7 rangefinder film camera product',
  'voigtlander-bessa': 'Voigtlander Bessa R2M rangefinder camera',
  'zeiss-ikon-zm':     'Zeiss Ikon ZM rangefinder camera product',
  'minolta-cle':       'Minolta CLE rangefinder film camera',
  'canon-p':           'Canon P rangefinder film camera product',
  'rollei-35s':        'Rollei 35S compact film camera product',
  'canon-ae1':         'Canon AE-1 SLR film camera product',
  'olympus-om1':       'Olympus OM-1 SLR film camera product',
  'nikon-fm2':         'Nikon FM2 SLR film camera product',
  'pentax-k1000':      'Pentax K1000 SLR film camera product',
  'nikon-f3':          'Nikon F3 SLR film camera product',
  'canon-f1-new':      'Canon New F-1 SLR film camera product',
  'leica-r6':          'Leica R6 SLR film camera product',
  'contax-s2':         'Contax S2 SLR film camera product',
  'minolta-x700':      'Minolta X-700 SLR film camera product',
  'olympus-om4-ti':    'Olympus OM-4 Ti SLR film camera titanium',
  'hasselblad-500cm':  'Hasselblad 500CM medium format camera product',
  'mamiya-7':          'Mamiya 7 II medium format rangefinder camera',
  'pentax-67':         'Pentax 67 II medium format SLR camera product',
  'rolleiflex-28f':    'Rolleiflex 2.8F TLR medium format camera product',
  'contax-645':        'Contax 645 medium format camera product',
  'mamiya-rz67':       'Mamiya RZ67 Pro II medium format camera product',
  'fuji-gw690':        'Fuji GW690 III medium format camera product',
  'bronica-sq-ai':     'Bronica SQ-Ai medium format camera product',
  'plaubel-makina-67': 'Plaubel Makina 67 medium format camera product',
  'yashica-mat-124g':  'Yashica Mat-124G TLR medium format camera product',
  'hasselblad-xpan':   'Hasselblad XPan panoramic film camera product',
  'nikon-f6':          'Nikon F6 professional SLR film camera product',
  'canon-eos-1v':      'Canon EOS 1V professional SLR film camera product',
  'contax-g2':         'Contax G2 autofocus rangefinder camera product',
  'fujifilm-ga645':    'Fujifilm GA645 medium format camera product',
  'lomo-lca':          'Lomo LC-A film camera product',
  'holga-120n':        'Holga 120N medium format toy camera product',
  'konica-big-mini':   'Konica Big Mini compact film camera product',
  'nikon-l35af':       'Nikon L35AF compact film camera product',
  'pentax-17':         'Pentax 17 half frame film camera 2024',
};

async function getDDGToken(query) {
  const url = `https://duckduckgo.com/?q=${encodeURIComponent(query)}&ia=images`;
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  const html = await res.text();
  const match = html.match(/vqd=([\d-]+)/);
  return match?.[1] ?? null;
}

async function searchDDGImages(query, vqd) {
  const url = `https://duckduckgo.com/i.js?l=us-en&o=json&q=${encodeURIComponent(query)}&vqd=${vqd}&f=,,,&p=1`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': UA,
      'Referer': 'https://duckduckgo.com/',
      'Accept': 'application/json',
    }
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.results ?? [];
}

function isProductImage(result) {
  const url = (result.image ?? '').toLowerCase();
  const title = (result.title ?? '').toLowerCase();
  // Exclude obvious non-product images
  const bad = ['portrait', 'street photo', 'sample photo', 'flickr.com/photos'];
  if (bad.some(b => title.includes(b))) return false;
  // Prefer cleaner image sources
  const good = ['.jpg', '.jpeg', '.png'];
  return good.some(e => url.endsWith(e));
}

async function downloadImage(url, dest) {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, 'Referer': 'https://duckduckgo.com/' }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = await res.arrayBuffer();
  if (buf.byteLength < 10000) throw new Error('File too small (likely blocked)');
  fs.writeFileSync(dest, Buffer.from(buf));
}

function extFromUrl(url) {
  const m = url.match(/\.(jpe?g|png|webp)/i);
  return m ? m[1].toLowerCase().replace('jpeg', 'jpg') : 'jpg';
}

async function processCamera(camera) {
  if (SINGLE_ID && camera.id !== SINGLE_ID) return camera.wikiImage ?? '';

  if (!FORCE) {
    const cached = ['jpg', 'png', 'webp']
      .map(e => path.join(OUTPUT_DIR, `${camera.id}.${e}`))
      .find(p => fs.existsSync(p));
    if (cached) {
      process.stdout.write(`  ✓ ${camera.name.padEnd(40)} (cached)\n`);
      return path.basename(cached);
    }
  }

  const query = SEARCH_TERMS[camera.id] ?? `${camera.name} film camera product photo`;

  try {
    const vqd = await getDDGToken(query);
    if (!vqd) throw new Error('Could not get DDG token');
    await sleep(300);

    const results = await searchDDGImages(query, vqd);
    const candidates = results.filter(isProductImage);

    for (const r of candidates.slice(0, 5)) {
      const imageUrl = r.image;
      if (!imageUrl) continue;
      const ext = extFromUrl(imageUrl);
      const dest = path.join(OUTPUT_DIR, `${camera.id}.${ext}`);

      // Remove old version
      ['jpg', 'png', 'webp'].forEach(e => {
        const old = path.join(OUTPUT_DIR, `${camera.id}.${e}`);
        if (old !== dest && fs.existsSync(old)) fs.unlinkSync(old);
      });

      try {
        await downloadImage(imageUrl, dest);
        process.stdout.write(`  ✓ ${camera.name.padEnd(40)} → ${camera.id}.${ext}\n`);
        return `${camera.id}.${ext}`;
      } catch { continue; }
    }

    process.stdout.write(`  ✗ ${camera.name.padEnd(40)} NOT FOUND\n`);
    return camera.wikiImage ?? '';
  } catch (e) {
    process.stdout.write(`  ✗ ${camera.name.padEnd(40)} ERROR: ${e.message}\n`);
    return camera.wikiImage ?? '';
  }
}

const target = SINGLE_ID ? `camera: ${SINGLE_ID}` : `${cameras.length} cameras`;
console.log(`\nFetching product photos for ${target}...\n`);
if (FORCE) {
  ['jpg','png','webp'].forEach(() => {});
  if (!SINGLE_ID) {
    fs.readdirSync(OUTPUT_DIR).forEach(f => fs.unlinkSync(path.join(OUTPUT_DIR, f)));
  }
}

const results = {};
for (const camera of cameras) {
  results[camera.id] = await processCamera(camera);
  await sleep(800);
}

// Update cameras.json
const updated = cameras.map(c => ({ ...c, wikiImage: results[c.id] ?? c.wikiImage ?? '' }));
fs.writeFileSync(CAMERAS_PATH, JSON.stringify(updated, null, 2));

const found = Object.values(results).filter(Boolean).length;
console.log(`\n──────────────────────────────────────`);
console.log(`  Found: ${found} / ${cameras.length}`);
const missing = cameras.filter(c => !results[c.id]);
if (missing.length) {
  console.log(`  Missing:`);
  missing.forEach(c => console.log(`    - ${c.name}`));
}
console.log(`  cameras.json updated ✓`);
console.log(`──────────────────────────────────────\n`);
