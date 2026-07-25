/* eslint-disable no-console, no-await-in-loop */
/**
 * Extract each Customer First press-release page's "Related Stories" cards from
 * the LIVE source site and write tools/importer/related-stories.json:
 *   { "<leaf-slug>": ["<related-slug>", ...] }   (delivery/imported slugs)
 *
 * The source renders a 12-card carousel but only the first three items are
 * shown (the rest carry a `hidden` class). We read the non-hidden card links,
 * then map each source slug to the actual imported directory name (the import
 * normalized the source's double/trailing dashes).
 *
 * A page with no Related Stories section (no non-hidden cards) is written as an
 * empty array, so the generator omits Section 3 for it.
 *
 * Usage: node tools/importer/extract-related-stories.mjs
 */
import { readFile, writeFile, readdir } from 'fs/promises';

const SKILL = '/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts/node_modules';
const pw = await import(`${SKILL}/playwright/index.js`);
const chromium = pw.chromium || pw.default.chromium;

const ARTICLES_DIR = 'language-masters/en/newsroom/press-releases/customer-first';
const CATEGORY_URL_PATH = '/us/en/newsroom/press-releases/customer-first';

// Map a source slug (from a card href) to the imported directory name. The
// import collapsed double dashes and dropped trailing dashes; match against the
// real imported slugs so paths resolve on delivery.
function buildSlugMatcher(importedSlugs) {
  const norm = (s) => s.replace(/-+/g, '-').replace(/^-|-$/g, '');
  const byNorm = new Map(importedSlugs.map((s) => [norm(s), s]));
  return (sourceSlug) => byNorm.get(norm(sourceSlug)) || null;
}

async function main() {
  const entries = await readdir(`content/${ARTICLES_DIR}`);
  const importedSlugs = entries
    .filter((f) => f.endsWith('.plain.html'))
    .map((f) => f.replace(/\.plain\.html$/, ''))
    .sort();

  const matchSlug = buildSlugMatcher(importedSlugs);

  // Source URLs come from urls-customer-first.txt (authoritative source hrefs,
  // with the original double/trailing dashes as on about.ups.com).
  const urlsRaw = await readFile('tools/importer/urls-customer-first.txt', 'utf8');
  const sourceUrls = urlsRaw.split('\n').map((l) => l.trim()).filter(Boolean);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 2000 } });

  const map = {};
  for (let i = 0; i < sourceUrls.length; i += 1) {
    const url = sourceUrls[i];
    const sourceSlug = url.split('/').pop().replace(/\.html$/, '');
    const importedSlug = matchSlug(sourceSlug);
    if (!importedSlug) {
      console.log(`SKIP (no imported page): ${sourceSlug}`);
      continue;
    }
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
      // Related cards are lazy-loaded; scroll to the bottom to trigger it and
      // wait for the card list to populate (tolerate pages that never show one).
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      try {
        await page.waitForSelector('.upspr-stories-list__item', { timeout: 15000 });
      } catch (e) { /* no related section on this page */ }
      await page.waitForTimeout(1500);
      // Read the non-hidden related-story card destinations, in DOM order.
      const slugs = await page.evaluate((catPath) => {
        const items = [...document.querySelectorAll('.upspr-stories-list__item')];
        const shown = items.filter((el) => !el.classList.contains('hidden'));
        const out = [];
        const seen = new Set();
        shown.forEach((el) => {
          const a = el.querySelector('a[href*="/customer-first/"]');
          if (!a) return;
          const href = a.getAttribute('href') || '';
          if (href.replace(/\.html$/, '').endsWith(catPath)) return; // skip category link
          const m = href.match(/\/customer-first\/([^/?#]+)\.html/);
          if (m && !seen.has(m[1])) { seen.add(m[1]); out.push(m[1]); }
        });
        return out;
      }, CATEGORY_URL_PATH);

      const mapped = slugs.map((s) => matchSlug(s)).filter(Boolean).slice(0, 3);
      map[importedSlug] = mapped;
      console.log(`${importedSlug}: ${mapped.length} related`);
    } catch (e) {
      console.log(`ERROR ${sourceSlug}: ${e.message}`);
      map[importedSlug] = [];
    }
  }

  await browser.close();
  await writeFile(
    'tools/importer/related-stories.json',
    `${JSON.stringify(map, null, 2)}\n`,
    'utf8',
  );
  const withRelated = Object.values(map).filter((v) => v.length).length;
  console.log(`\nWrote related-stories.json — ${Object.keys(map).length} pages, ${withRelated} with related stories.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
