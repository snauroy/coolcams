/**
 * Fetch PRODUCT photos for all cameras from Wikimedia Commons.
 * Strategy (in order):
 *   1. Manual override  — exact Commons filename for tricky cameras
 *   2. Commons category — files listed in Category:[Camera Name]
 *   3. Commons filename filter — search results whose filename contains brand + model
 *   4. Wikipedia infobox — article's own representative image (last resort)
 *
 * Usage: node scripts/fetch-camera-images.mjs [--force]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname  = path.dirname(fileURLToPath(import.meta.url));
const CAMERAS_PATH = path.join(__dirname, '../data/cameras.json');
const OUTPUT_DIR   = path.join(__dirname, '../public/cameras');
const FORCE        = process.argv.includes('--force');

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const cameras = JSON.parse(fs.readFileSync(CAMERAS_PATH, 'utf-8'));
const UA = 'CoolCams/1.0 (https://github.com/snauroy/coolcams)';
const DELAY = 600;

// ─── Manual overrides ────────────────────────────────────────────────────────
// Exact Wikimedia Commons file names (without "File:" prefix)
const MANUAL_OVERRIDES = {
  'contax-t2':         'Contax T2.jpg',
  'contax-t3':         'Contax T3.jpg',
  'yashica-t4':        'Yashica T4.jpg',
  'olympus-mju-ii':    'Olympus mju-II.jpg',
  'ricoh-gr1s':        'Ricoh GR1S.jpg',
  'minolta-tc1':       'Minolta TC-1.jpg',
  'nikon-35ti':        'Nikon 35Ti.jpg',
  'leica-minilux':     'Leica Minilux.jpg',
  'konica-hexar-af':   'Konica Hexar AF.jpg',
  'leica-m6':          'Leica M6 IMG 0593.jpg',
  'leica-m3':          'Leica M3.jpg',
  'leica-m4':          'Leica M4.jpg',
  'leica-m-a':         'Leica M-A.jpg',
  'leica-m7':          'Leica M7.jpg',
  'zeiss-ikon-zm':     'Zeiss Ikon ZM 2 and CV Ultron 35mm.jpg',
  'minolta-cle':       'Minolta CLE.jpg',
  'canon-p':           'Canon P.jpg',
  'rollei-35s':        'Rollei35S-silver.jpg',
  'canon-ae1':         'Canon AE-1.jpg',
  'olympus-om1':       'Olympus OM-1.jpg',
  'nikon-fm2':         'Nikon FM2.jpg',
  'pentax-k1000':      'Pentax K1000.jpg',
  'nikon-f3':          'Nikon F3 HP.jpg',
  'canon-f1-new':      'Canon New F-1.jpg',
  'leica-r6':          'Leica R6.jpg',
  'contax-s2':         'Contax S2.jpg',
  'minolta-x700':      'Minolta X-700.jpg',
  'olympus-om4-ti':    'Olympus OM-4T.jpg',
  'hasselblad-500cm':  'Hasselblad500CM.jpg',
  'mamiya-7':          'Mamiya 7camera.jpg',
  'pentax-67':         'Pentax 6x7.jpg',
  'rolleiflex-28f':    'Rolleiflex 2.8f.jpg',
  'contax-645':        'Contax 645 with 80mm f2.jpg',
  'mamiya-rz67':       'Mamiya RZ67.jpg',
  'fuji-gw690':        'Fuji Gw690iii (222408623).jpeg',
  'bronica-sq-ai':     'Bronica SQ-Ai.jpg',
  'plaubel-makina-67': 'Plaubel Makina 67.jpg',
  'yashica-mat-124g':  'Yashica-Mat 124G.jpg',
  'hasselblad-xpan':   'Hasselblad Xpan.jpg',
  'nikon-f6':          'Nikon F6.jpg',
  'canon-eos-1v':      'Canon EOS 1V.jpg',
  'contax-g2':         'Contax G2.jpg',
  'fujifilm-ga645':    'FujiFilm GA645.jpg',
  'lomo-lca':          'Lomo LC-A.jpg',
  'holga-120n':        'Holga 120N.jpg',
  'konica-big-mini':   'Konica Big Mini.jpg',
  'nikon-l35af':       'Nikon L35AF.jpg',
  'pentax-17':         'Pentax 17 film camera.jpg',
  'voigtlander-bessa': 'Voigtlander Bessa R2M.jpg',
  'fujifilm-klasse':   'Fujifilm Klasse W.jpg',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function apiFetch(url) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

/** Get the direct URL for a Commons file by exact filename */
async function getCommonsFileUrl(filename) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(filename)}&prop=imageinfo&iiprop=url|mime&format=json&origin=*`;
  const data = await apiFetch(url);
  if (!data) return null;
  const pages = Object.values(data.query?.pages ?? {});
  const info = pages[0]?.imageinfo?.[0];
  if (!info || pages[0].missing !== undefined) return null;
  return info.url;
}

/** List files in a Commons category */
async function getCategoryFiles(categoryName) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&list=categorymembers&cmtitle=Category:${encodeURIComponent(categoryName)}&cmtype=file&cmlimit=10&format=json&origin=*`;
  const data = await apiFetch(url);
  return data?.query?.categorymembers?.map(m => m.title.replace('File:', '')) ?? [];
}

/** Returns true if filename looks like a product photo of this camera */
function isProductPhoto(filename, camera) {
  const f = filename.toLowerCase().replace(/[\s_\-]/g, '');
  const brand = camera.brand.toLowerCase().replace(/[\s_\-]/g, '');

  if (!f.includes(brand)) return false;

  // Reject filenames that look like photos taken WITH the camera
  const sampleIndicators = [/^\d{3,}/, /dsc\d/, /img_\d/, /photo_\d/, /sample/, /taken/];
  if (sampleIndicators.some(rx => rx.test(f))) return false;

  // Model tokens: significant parts of the model name
  const primaryName = camera.name.split(/\s*[\/,]\s*/)[0].trim();
  const tokens = primaryName.toLowerCase()
    .replace(/[_\-]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length >= 2 && t !== brand && !['the', 'new', 'and', 'pro', 'program'].includes(t));

  return tokens.some(t => f.includes(t.replace(/[\s_\-]/g, '')));
}

/** Search Commons and return the first filename that looks like a product photo */
async function searchCommonsProductPhoto(camera) {
  const query = camera.name.split('/')[0].trim();
  const url = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srnamespace=6&srlimit=15&format=json&origin=*`;
  const data = await apiFetch(url);
  if (!data?.query?.search) return null;

  for (const result of data.query.search) {
    const filename = result.title.replace('File:', '');
    if (isProductPhoto(filename, camera)) return filename;
  }
  return null;
}

/** Last resort: Wikipedia article's representative image */
async function getWikipediaInboxImage(camera) {
  const query = camera.name.split('/')[0].trim();
  const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(query)}&prop=pageimages&piprop=original&format=json&origin=*`;
  const data = await apiFetch(url);
  if (!data) return null;
  const pages = Object.values(data.query?.pages ?? {});
  if (!pages[0] || pages[0].pageid === -1) return null;
  return pages[0]?.original?.source ?? null;
}

async function downloadUrl(url, dest) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = await res.arrayBuffer();
  fs.writeFileSync(dest, Buffer.from(buf));
}

function extFromUrl(url) {
  const m = url.match(/\.(jpe?g|png|webp)/i);
  return m ? m[1].toLowerCase().replace('jpeg', 'jpg') : 'jpg';
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function processCamera(camera) {
  // Check cache unless --force
  if (!FORCE) {
    const cached = ['jpg', 'png', 'webp']
      .map(e => path.join(OUTPUT_DIR, `${camera.id}.${e}`))
      .find(p => fs.existsSync(p));
    if (cached) {
      process.stdout.write(`  ✓ ${camera.name.padEnd(38)} (cached)\n`);
      return path.basename(cached);
    }
  }

  let imageUrl = null;
  let method = '';

  // 1. Manual override → exact Commons filename
  if (MANUAL_OVERRIDES[camera.id]) {
    const commonsUrl = await getCommonsFileUrl(MANUAL_OVERRIDES[camera.id]);
    if (commonsUrl) { imageUrl = commonsUrl; method = 'override'; }
  }

  // 2. Commons category
  if (!imageUrl) {
    const catName = camera.name.split('/')[0].trim();
    const files = await getCategoryFiles(catName);
    await sleep(200);
    const best = files.find(f => isProductPhoto(f, camera));
    if (best) {
      const commonsUrl = await getCommonsFileUrl(best);
      if (commonsUrl) { imageUrl = commonsUrl; method = 'category'; }
    }
  }

  // 3. Commons search with filename filter
  if (!imageUrl) {
    const filename = await searchCommonsProductPhoto(camera);
    await sleep(200);
    if (filename) {
      const commonsUrl = await getCommonsFileUrl(filename);
      if (commonsUrl) { imageUrl = commonsUrl; method = 'search'; }
    }
  }

  // 4. Wikipedia infobox (last resort)
  if (!imageUrl) {
    imageUrl = await getWikipediaInboxImage(camera);
    if (imageUrl) method = 'wikipedia';
  }

  if (!imageUrl) {
    process.stdout.write(`  ✗ ${camera.name.padEnd(38)} NOT FOUND\n`);
    return '';
  }

  const ext = extFromUrl(imageUrl);
  const filename = `${camera.id}.${ext}`;
  const dest = path.join(OUTPUT_DIR, filename);

  // Remove old version if different ext
  ['jpg', 'png', 'webp'].forEach(e => {
    const old = path.join(OUTPUT_DIR, `${camera.id}.${e}`);
    if (old !== dest && fs.existsSync(old)) fs.unlinkSync(old);
  });

  try {
    await downloadUrl(imageUrl, dest);
    process.stdout.write(`  ✓ ${camera.name.padEnd(38)} [${method}]\n`);
    return filename;
  } catch (e) {
    process.stdout.write(`  ✗ ${camera.name.padEnd(38)} download error: ${e.message}\n`);
    return '';
  }
}

console.log(`\nFetching product photos for ${cameras.length} cameras...`);
if (FORCE) console.log('  (--force: re-downloading all)\n');
else console.log('  (cached files skipped — use --force to re-download all)\n');

// Clear cache if --force
if (FORCE) {
  fs.readdirSync(OUTPUT_DIR).forEach(f => fs.unlinkSync(path.join(OUTPUT_DIR, f)));
}

const results = {};
for (const camera of cameras) {
  results[camera.id] = await processCamera(camera);
  await sleep(DELAY);
}

// Update cameras.json
const updated = cameras.map(c => ({ ...c, wikiImage: results[c.id] ?? '' }));
fs.writeFileSync(CAMERAS_PATH, JSON.stringify(updated, null, 2));

const found   = Object.values(results).filter(Boolean).length;
const missing = cameras.length - found;
console.log(`\n───────────────────────────────────`);
console.log(`  Found:   ${found} / ${cameras.length}`);
if (missing > 0) {
  console.log(`  Missing: ${missing}`);
  cameras.filter(c => !results[c.id]).forEach(c => console.log(`    - ${c.name}`));
}
console.log(`  cameras.json updated ✓`);
console.log(`───────────────────────────────────\n`);
