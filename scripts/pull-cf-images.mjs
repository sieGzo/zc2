// Node 18+ (ma global fetch)
// UŻYCIE: node scripts/pull-cf-images.mjs data/jemfit_recipes.jsonl public/recipes

import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const [,, jsonlPath = 'data/jemfit_recipes.jsonl', outDir = 'public/recipes'] = process.argv;

function isCF(url) { return /(^https?:)?\/\/.*imagedelivery\.net\//i.test(url); }

function extractImage(obj) {
  const cands = [
    obj.image, obj.img, obj.photo, obj.image_url, obj.imageUrl, obj.picture,
    Array.isArray(obj.photos) ? obj.photos[0] : undefined,
  ];
  for (const c of cands) if (typeof c === 'string' && c.trim()) return c.trim();
  return null;
}

function inferNameFromUrl(u) {
  try {
    const url = new URL(u, 'https://dummy/');
    // np: https://imagedelivery.net/ACCOUNT/IMAGE_ID/public
    const parts = url.pathname.split('/').filter(Boolean);
    const imageId = parts.at(-2) || parts.at(-1) || crypto.randomUUID();
    return imageId;
  } catch {
    return crypto.randomUUID();
  }
}

async function ensureDir(p) { await fsp.mkdir(p, { recursive: true }); }

async function download(url, fileBase) {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const ct = res.headers.get('content-type') || '';
  const ext = ct.includes('image/webp') ? 'webp'
           : ct.includes('image/png')  ? 'png'
           : ct.includes('image/jpeg') ? 'jpg'
           : 'img';
  const filename = `${fileBase}.${ext}`;
  const buf = Buffer.from(await res.arrayBuffer());
  await fsp.writeFile(filename, buf);
  return path.basename(filename);
}

async function run() {
  if (!fs.existsSync(jsonlPath)) {
    console.error(`Nie znaleziono ${jsonlPath}`);
    process.exit(1);
  }
  await ensureDir(outDir);
  const lines = (await fsp.readFile(jsonlPath, 'utf8'))
    .split(/\n+/).filter(Boolean);

  const map = {}; // id -> local relative path
  let ok = 0, fail = 0, skipped = 0;

  for (let i = 0; i < lines.length; i++) {
    let obj;
    try { obj = JSON.parse(lines[i]); } catch { continue; }
    const id = obj.id?.toString() ?? String(i);
    const img = extractImage(obj);
    if (!img || !isCF(img)) { skipped++; continue; }

    const baseName = inferNameFromUrl(img);
    const fileBase = path.join(outDir, `${id}-${baseName}`);
    try {
      const saved = await download(img, fileBase);
      map[id] = `/recipes/${saved}`;
      ok++;
      process.stdout.write(`✔ ${id} → ${saved}\n`);
    } catch (e) {
      fail++;
      process.stdout.write(`✖ ${id} (${e.message})\n`);
    }
  }

  const mapPath = path.join(outDir, '..', 'recipes_images.json');
  await fsp.writeFile(mapPath, JSON.stringify(map, null, 2), 'utf8');

  console.log(`\nDone. OK:${ok} FAIL:${fail} SKIP:${skipped}`);
  console.log(`Mapa: ${mapPath}`);
}

run().catch(e => { console.error(e); process.exit(1); });
