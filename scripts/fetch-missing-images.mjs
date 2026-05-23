/**
 * Fetch the 3 missing camera images using Openverse API
 * (Creative Commons search engine — no API key needed for basic use)
 *
 * Usage: node scripts/fetch-missing-images.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, '../public/cameras');
const CAMERAS_PATH = path.join(__dirname, '../data/cameras.json');

const UA = 'CoolCams/1.0 (https://github.com/snauroy/coolcams)';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const MISSING = [
  { id: 'fujifilm-klasse', queries: ['Fujifilm Klasse W camera', 'Fuji Klasse film camera'] },
  { id: 'leica-m-a',       queries: ['Leica M-A film camera', 'Leica MA Typ 127'] },
  { id: 'fujifilm-ga645',  queries: ['Fujifilm GA645 camera', 'Fuji GA645 medium format camera'] },
];

async function searchOpenverse(query) {
  const url = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}&license_type=commercial&format=json&page_size=10`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, 'Accept': 'application/json' }
    });
    if (!res.ok) { console.log(`    Openverse HTTP ${res.status}`); return []; }
    const data = await res.json();
    return data.results ?? [];
  } catch (e) { console.log(`    Openverse error: ${e.message}`); return []; }
}

async function searchFlickrCC(query) {
  // Flickr public photo search (no key needed for basic RSS)
  const url = `https://www.flickr.com/search/show/?text=${encodeURIComponent(query)}&license=4%2C5%2C6%2C9%2C10&media=photos&content_type=1&format=json&nojsoncallback=1`;
  // Use Flickr API public endpoint instead
  const apiUrl = `https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=&text=${encodeURIComponent(query)}&license=1,2,3,4,5,6&per_page=5&format=json&nojsoncallback=1`;
  // Skip Flickr — use Openverse which already indexes Flickr CC content
  return [];
}

function isProductPhotoUrl(url, query) {
  // Heuristic: avoid obvious non-product URLs
  const u = url.toLowerCase();
  return !u.includes('sample') && !u.includes('street') && !u.includes('portrait');
}

async function downloadImage(url, dest) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = await res.arrayBuffer();
  fs.writeFileSync(dest, Buffer.from(buf));
}

function extFromUrl(url) {
  const m = url.match(/\.(jpe?g|png|webp)/i);
  return m ? m[1].toLowerCase().replace('jpeg', 'jpg') : 'jpg';
}

console.log('\nSearching Openverse (CC-licensed) for 3 missing cameras...\n');

const updates = {};

for (const camera of MISSING) {
  console.log(`→ ${camera.id}`);
  let found = false;

  for (const query of camera.queries) {
    if (found) break;
    console.log(`  Query: "${query}"`);
    const results = await searchOpenverse(query);
    console.log(`  Results: ${results.length}`);

    for (const r of results) {
      const imageUrl = r.url;
      if (!imageUrl) continue;
      console.log(`  Candidate: ${r.title ?? 'untitled'} — ${imageUrl.slice(0, 60)}...`);

      const ext = extFromUrl(imageUrl);
      const dest = path.join(OUTPUT_DIR, `${camera.id}.${ext}`);

      try {
        await downloadImage(imageUrl, dest);
        console.log(`  ✓ Downloaded → ${camera.id}.${ext}`);
        console.log(`    License: ${r.license} | Source: ${r.foreign_landing_url}`);
        updates[camera.id] = `${camera.id}.${ext}`;
        found = true;
        break;
      } catch (e) {
        console.log(`  Download failed: ${e.message}`);
      }
    }

    await sleep(1200); // Openverse rate limit: 5 req/min unauthenticated
  }

  if (!found) {
    console.log(`  ✗ Not found\n`);
  } else {
    console.log('');
  }
}

// Update cameras.json
if (Object.keys(updates).length > 0) {
  const cameras = JSON.parse(fs.readFileSync(CAMERAS_PATH, 'utf-8'));
  const updated = cameras.map(c => updates[c.id] ? { ...c, wikiImage: updates[c.id] } : c);
  fs.writeFileSync(CAMERAS_PATH, JSON.stringify(updated, null, 2));
  console.log(`cameras.json updated for: ${Object.keys(updates).join(', ')}`);
}

console.log('\nDone.\n');
