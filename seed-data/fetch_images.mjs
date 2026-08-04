// Fetch real product images via z-ai image-search CLI (parallel + resumable)
// Output: /home/z/my-project/seed-data/images.json
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { writeFileSync, readFileSync, existsSync } from 'node:fs';

const execFileAsync = promisify(execFile);

const PRODUCT_QUERIES = [
  'wireless over-ear headphones product photo',
  'smart 4k television on stand product',
  'modern smartphone product photo',
  'tablet device on table product',
  'mens casual jacket fashion clothing',
  'womens summer dress fashion clothing',
  'designer sunglasses product photo',
  'white sneakers shoes product photo',
  'stainless steel cookware pots set kitchen',
  'air fryer kitchen appliance product',
  'coffee maker machine kitchen product',
  'skincare serum bottles cosmetics beauty',
  'makeup palette kit beauty product',
  'hair dryer product photo',
  'yoga mat fitness exercise equipment',
  'dumbbell weights set gym fitness',
  'camping tent outdoor gear',
  'kids building blocks toy set',
  'remote control car toy',
  'coffee beans bag grocery',
  'bedding bed sheet set home',
  'smartwatch fitness tracker on wrist',
  'mechanical gaming keyboard rgb',
  'action camera 4k product',
];

const HERO_QUERY = 'online shopping sale banner colorful';

const CATEGORIES = [
  'Electronics',
  'Phones & Tablets',
  'Fashion',
  'Home & Kitchen',
  'Beauty & Health',
  'Sports & Outdoors',
  'Toys & Games',
  'Groceries',
];

const PARTIAL_PATH = '/home/z/my-project/seed-data/images_partial.json';
const CONCURRENCY = 6;

async function runSearch(query, count) {
  try {
    const { stdout } = await execFileAsync(
      'z-ai',
      ['image-search', '-q', query, '--count', String(count), '--gl', 'us', '--no-rank'],
      { encoding: 'utf8', timeout: 180000, maxBuffer: 10 * 1024 * 1024 }
    );
    const jsonStart = stdout.indexOf('{');
    if (jsonStart === -1) return [];
    const parsed = JSON.parse(stdout.slice(jsonStart));
    if (!parsed || !Array.isArray(parsed.results)) return [];
    return parsed.results
      .map((r) => (r && r.original_url ? r.original_url : null))
      .filter((u) => typeof u === 'string' && u.length > 0);
  } catch (err) {
    console.error(`[ERROR] "${query}" failed: ${err.message}`);
    return [];
  }
}

function loadPartial() {
  if (existsSync(PARTIAL_PATH)) {
    try {
      return JSON.parse(readFileSync(PARTIAL_PATH, 'utf8'));
    } catch {
      return {};
    }
  }
  return {};
}

function savePartial(obj) {
  writeFileSync(PARTIAL_PATH, JSON.stringify(obj, null, 2));
}

// Pool runner: runs tasks with concurrency limit
async function runPool(tasks, concurrency) {
  const results = new Array(tasks.length);
  let nextIndex = 0;
  async function worker(workerId) {
    while (true) {
      const idx = nextIndex++;
      if (idx >= tasks.length) return;
      results[idx] = await tasks[idx]();
    }
  }
  const workers = [];
  for (let i = 0; i < concurrency; i++) workers.push(worker(i));
  await Promise.all(workers);
  return results;
}

async function main() {
  const output = loadPartial();
  let totalUrls = 0;
  let succeededQueries = 0;
  for (const k of Object.keys(output)) {
    const v = output[k];
    if (Array.isArray(v)) {
      totalUrls += v.length;
      succeededQueries += 1;
    } else if (v && typeof v === 'object') {
      for (const sub of Object.values(v)) {
        if (Array.isArray(sub)) totalUrls += sub.length;
      }
      succeededQueries += 1;
    }
  }
  console.log(`[resume] loaded partial with ${Object.keys(output).length} top-level keys, ${totalUrls} urls so far`);

  // Build task list: skip ones already done
  const tasks = [];

  for (const q of PRODUCT_QUERIES) {
    if (output[q] && output[q].length > 0) {
      console.log(`[skip] product "${q}" already has ${output[q].length} urls`);
      continue;
    }
    tasks.push(async () => {
      const urls = await runSearch(q, 4);
      if (urls.length > 0) output[q] = urls;
      console.log(`[product] "${q}" -> ${urls.length} urls`);
      savePartial(output);
      return urls.length;
    });
  }

  if (!output['__hero__'] || output['__hero__'].length === 0) {
    tasks.push(async () => {
      const urls = await runSearch(HERO_QUERY, 3);
      if (urls.length > 0) output['__hero__'] = urls;
      console.log(`[hero] "${HERO_QUERY}" -> ${urls.length} urls`);
      savePartial(output);
      return urls.length;
    });
  } else {
    console.log(`[skip] hero already has ${output['__hero__'].length} urls`);
  }

  // Categories
  if (!output['__categories__']) output['__categories__'] = {};
  for (const cat of CATEGORIES) {
    if (output['__categories__'][cat] && output['__categories__'][cat].length > 0) {
      console.log(`[skip] category "${cat}" already has ${output['__categories__'][cat].length} urls`);
      continue;
    }
    const q = `${cat} shopping category icon illustration`;
    tasks.push(async () => {
      const urls = await runSearch(q, 1);
      if (urls.length > 0) output['__categories__'][cat] = urls;
      console.log(`[category] "${q}" -> ${urls.length} urls`);
      savePartial(output);
      return urls.length;
    });
  }

  console.log(`\n[run] ${tasks.length} remaining tasks with concurrency=${CONCURRENCY}\n`);
  await runPool(tasks, CONCURRENCY);

  // Recompute totals
  totalUrls = 0;
  succeededQueries = 0;
  for (const k of Object.keys(output)) {
    const v = output[k];
    if (k === '__categories__') {
      for (const sub of Object.values(v)) {
        if (Array.isArray(sub) && sub.length > 0) {
          totalUrls += sub.length;
          succeededQueries += 1;
        }
      }
    } else if (Array.isArray(v) && v.length > 0) {
      totalUrls += v.length;
      succeededQueries += 1;
    }
  }

  // Write final JSON (omit empty keys)
  const final = {};
  for (const [k, v] of Object.entries(output)) {
    if (k === '__categories__') {
      const sub = {};
      for (const [c, u] of Object.entries(v)) {
        if (Array.isArray(u) && u.length > 0) sub[c] = u;
      }
      if (Object.keys(sub).length > 0) final[k] = sub;
    } else if (Array.isArray(v) && v.length > 0) {
      final[k] = v;
    }
  }
  const outPath = '/home/z/my-project/seed-data/images.json';
  writeFileSync(outPath, JSON.stringify(final, null, 2));

  console.log(`\n=== DONE ===`);
  console.log(`Queries with at least one image: ${succeededQueries}`);
  console.log(`Total image URLs collected: ${totalUrls}`);
  console.log(`Output file: ${outPath}`);

  writeFileSync('/home/z/my-project/seed-data/images_summary.json', JSON.stringify({
    succeededQueries,
    totalUrls,
    outPath,
  }, null, 2));
}

main().catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});
