// Node 18+ (global fetch)
// UŻYCIE:
//   node scripts/pull-cf-images.mjs data/jemfit_recipes.jsonl public/recipes
// Opcjonalnie ustaw wariant Cloudflare:
//   CF_VARIANT=public node scripts/pull-cf-images.mjs ...

import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const [,, jsonlPath = 'data/jemfit_recipes.jsonl', outDir = 'public/recipes'] = process.argv;
const CF_VARIANT = process.env.CF_VARIANT || 'public';

function isHttpUrl(s) {
  return typeof s === 'string' && /^https?:\/\//i.test(s);
}
function isImageLikeUrl(s) {
  return isHttpUrl(s) && /\.(webp|png|jpe?g|gif|avif)(\?.*)?$/i.test(s);
}
function looksLikeImageDelivery(s) {
  return typeof s === 'string' && /(^https?:)?\/\/.*imagedelivery\.net\//i.test(s);
}
function tryBuildCfUrlFromId(obj) {
  // Spróbuj złożyć URL gdy mamy same ID-e
  // Oczekiwane pola (dowolne): account|account_hash|cf_account, cf_image_id|image_id|id
  const account = obj.account || obj.account_hash || obj.cf_account || obj.cloudflare_account;
  const imageId = obj.cf_image_id || obj.image_id || obj.cloudflare_image_id || obj.id;
  if (account && imageId) {
    return `https://imagedelivery.net/${account}/${imageId}/${CF_VARIANT}`;
  }
  return null;
}

// rekurencyjne szukanie URL-i w obiekcie
function collectImageUrls(obj) {
  const out = [];
  const seen = new Set();

  function push(u) {
    if (typeof u !== 'string') return;
    const s = u.trim();
    if (!s) return;
    if (!isHttpUrl(s)) return;
    if (seen.has(s)) return;
    seen.add(s);
    out.push(s);
  }

  function walk(x) {
    if (!x) return;
    if (typeof x === 'string') {
      if (isHttpUrl(x)) push(x);
      return;
    }
    if (Array.isArray(x)) {
      for (const v of x) walk(v);
      return;
    }
    if (typeof x === 'object') {
      // spróbuj złożyć Cloudflare URL z ID
      const built = tryBuildCfUrlFromId(x);
      if (built) push(built);

      for (const [k, v] of Object.entries(x)) {
        const key = k.toLowerCase();

        // preferencyjne klucze
        if (['image','img','photo','picture','cover','thumbnail'].includes(key)) {
          if (typeof v === 'string') push(v);
          else walk(v);
          continue;
        }
        if (['url','src','href'].includes(key)) {
          if (typeof v === 'string') push(v);
          else walk(v);
          continue;
        }
        if (key.startsWith('image') || key.startsWith('photo') || key.includes('thumb')) {
          if (typeof v === 'string') push(v);
          else walk(v);
          continue;
        }

        // tablice obiektów typu images: [{url:...}, {src:...}]
        walk(v);
      }
    }
  }

  walk(obj);
  return out;
}

async function ensureDir(p) { await fsp.mkdir(p, { recursive: true }); }

function inferFileBase(id, url) {
  try {
    const u = new URL(url);
    const parts = u.pathname.split('/').filter(Boolean);
    const last = parts[parts.length - 1] || 'img';
    const safeLast = last.replace(/[^a-z0-9_\-\.]/gi, '_');
    return `${id}-${safeLast || crypto.randomUUID()}`;
  } catch {
    return `${id}-${crypto.randomUUID()}`;
  }
}

function inferExt(contentType, url) {
  if (/image\/webp/i.test(contentType) || /\.webp(\?.*)?$/i.test(url)) return 'webp';
  if (/image\/png/i.test(contentType)  || /\.png(\?.*)?$/i.test(url))  return 'png';
  if (/image\/jpe?g/i.test(contentType)|| /\.(jpe?g)(\?.*)?$/i.test(url)) return 'jpg';
  if (/image\/gif/i.test(contentType)  || /\.gif(\?.*)?$/i.test(url))  return 'gif';
  if (/image\/avif/i.test(contentType) || /\.avif(\?.*)?$/i.test(url)) return 'avif';
  return 'img';
}

async function download(url, fileBasePath) {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const ct = res.headers.get('content-type') || '';
  const ext = inferExt(ct, url);
  const filename = `${fileBasePath}.${ext}`;
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
  const lines = (await fsp.readFile(jsonlPath, 'utf8')).split(/\n+/).filter(Boolean);

  const map = {};
  let ok = 0, fail = 0, skipped = 0;

  for (let i = 0; i < lines.length; i++) {
    let obj;
    try { obj = JSON.parse(lines[i]); } catch { skipped++; continue; }
    const id = obj.id?.toString() ?? String(i);

    // zbierz kandydatów URL (posortuj tak, by imagedelivery mieć pierwsze)
    const urls = collectImageUrls(obj).sort((a, b) => {
      const A = looksLikeImageDelivery(a) ? 0 : 1;
      const B = looksLikeImageDelivery(b) ? 0 : 1;
      return A - B;
    });

    if (!urls.length) { skipped++; continue; }

    let savedName = null;
    for (const candidate of urls) {
      try {
        const fileBase = path.join(outDir, inferFileBase(id, candidate));
        const saved = await download(candidate, fileBase);
        savedName = saved;
        break;
      } catch (e) {
        // spróbuj kolejny kandydat
      }
    }

    if (savedName) {
      map[id] = `/recipes/${savedName}`;
      ok++;
      process.stdout.write(`✔ ${id} → ${savedName}\n`);
    } else {
      fail++;
      process.stdout.write(`✖ ${id} (nie udało się pobrać żadnego z kandydatów)\n`);
    }
  }

  const mapPath = path.join(outDir, '..', 'recipes_images.json');
  await fsp.writeFile(mapPath, JSON.stringify(map, null, 2), 'utf8');

  console.log(`\nDone. OK:${ok} FAIL:${fail} SKIP:${skipped}`);
  console.log(`Mapa: ${mapPath}`);
}

run().catch(e => { console.error(e); process.exit(1); });
