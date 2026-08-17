/* eslint-disable no-console, no-await-in-loop, no-restricted-syntax, import/no-dynamic-require, global-require, max-len, object-curly-newline, object-property-newline, no-continue, no-nested-ternary, no-unused-vars */
/**
 * Press-releases migrated-page detail report.
 *
 * One row per migrated press-release page (all 7 categories), with exactly:
 *   Title | Category | Existing page URL | Migrated Page - Preview URL | Page Quality (out of 100)
 *
 * Page Quality = content/structural fidelity of the migrated page vs its live
 * about.ups.com source (title, description, category, date, image, body length,
 * tables), same weighting used for the financials verification.
 *
 * Output: content/press-releases-migrated-details.xlsx
 */
import { readFile, readdir } from 'fs/promises';

const SKILL = '/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts/node_modules';
const { JSDOM } = await import(`${SKILL}/jsdom/lib/api.js`);
const pw = await import(`${SKILL}/playwright/index.js`);
const chromium = pw.chromium || pw.default.chromium;
const require = (await import('module')).createRequire(import.meta.url);
const ExcelJS = require(`${SKILL}/exceljs/excel.js`);

const PR = 'content/language-masters/en/newsroom/press-releases';
const PREVIEW = 'https://main--ups-unified-site-eds-foundation--8497785.aem.page/us/en/newsroom/press-releases';
const SRC = 'https://about.ups.com/us/en/newsroom/press-releases';
const CATS = ['customer-first', 'financials', 'innovation-driven', 'local-community-engagement', 'our-strategy', 'people-led', 'sustainable-services'];
const CAT_LABEL = {
  'customer-first': 'Customer First', financials: 'Financials', 'innovation-driven': 'Innovation Driven',
  'local-community-engagement': 'Local Community Engagement', 'our-strategy': 'Our Strategy',
  'people-led': 'People Led', 'sustainable-services': 'Sustainable Services',
};
const norm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const dashNorm = (s) => (s || '').toLowerCase().replace(/-+/g, '-').replace(/^-|-$/g, '');
const text = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');

function extractMigrated(html) {
  const { document } = new JSDOM(html).window;
  const header = document.querySelector('.article-header');
  const byField = {};
  if (header) {
    [...header.querySelectorAll(':scope > div > div')].forEach((c) => {
      const m = c.innerHTML.match(/<!--\s*field:(\w+)\s*-->/);
      if (m) byField[m[1]] = c;
    });
  }
  const col = document.querySelector('.column-control > div > div');
  const metaRows = [...document.querySelectorAll('.metadata > div')];
  const descRow = metaRows.find((r) => (r.firstElementChild?.textContent || '').trim().toLowerCase() === 'description');
  return {
    title: text(byField.title) || text(document.querySelector('h1')),
    description: text(byField.description) || (descRow ? text(descRow.children[1]) : ''),
    category: text(byField.eyebrow),
    date: text(byField.articleDate),
    hasImage: !!document.querySelector('picture img, img'),
    bodyChars: col ? text(col).length : 0,
    tables: col ? col.querySelectorAll('table').length : 0,
  };
}

async function extractSource(page, url) {
  const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
  const title = await page.title();
  if (title === 'Access Denied' || (resp && resp.status() >= 400)) return { err: `HTTP ${resp ? resp.status() : '?'}` };
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(900);
  return page.evaluate(() => {
    const t = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');
    const meta = (s) => document.querySelector(s)?.getAttribute('content') || '';
    const body = document.querySelector('.upspr-two-column .cmp-text, .cmp-text.upspr-analytics, .upspr-two-column');
    return {
      title: t(document.querySelector('.upspr-two-column_title h1, h1')) || meta('meta[property="og:title"]'),
      description: t(document.querySelector('.upspr-two-column_subtext')) || meta('meta[name="description"]'),
      category: t(document.querySelector('.upspr-eyebrow, .upspr-two-column_eyebrow')) || meta('meta[name="categorytitle"]'),
      date: t(document.querySelector('.upspr-story-date')),
      hasImage: !!document.querySelector('.upspr-heroimage img, .upspr-two-column_image img'),
      bodyChars: body ? t(body).length : 0,
      tables: document.querySelectorAll('.upspr-two-column table, .cmp-text table').length,
    };
  });
}

const W = { title: 25, description: 15, category: 10, date: 10, image: 10, body: 20, tables: 10 };
function quality(mig, src) {
  const titleS = norm(mig.title) && norm(mig.title) === norm(src.title) ? 1
    : (norm(mig.title) && norm(src.title) && (norm(mig.title).includes(norm(src.title)) || norm(src.title).includes(norm(mig.title))) ? 0.9 : (norm(mig.title) ? 0.5 : 0));
  let descS;
  if (!norm(src.description) && !norm(mig.description)) descS = 1;
  else if (norm(mig.description) === norm(src.description)) descS = 1;
  else if (norm(mig.description) && norm(src.description)) descS = 0.8;
  else descS = 0;
  const catS = norm(mig.category) && norm(mig.category) === norm(src.category) ? 1 : (norm(mig.category) ? 0.6 : 0);
  const dateS = norm(mig.date) && norm(mig.date) === norm(src.date) ? 1 : (norm(mig.date) ? 0.6 : (norm(src.date) ? 0 : 1));
  const imgS = (mig.hasImage && src.hasImage) ? 1 : (!src.hasImage ? 1 : 0);
  const ratio = src.bodyChars > 0 ? Math.min(1, mig.bodyChars / src.bodyChars) : (mig.bodyChars > 0 ? 1 : 0);
  const tableS = src.tables === mig.tables ? 1 : (src.tables > 0 ? Math.min(1, mig.tables / src.tables) : 1);
  return Math.round(titleS * W.title + descS * W.description + catS * W.category + dateS * W.date + imgS * W.image + ratio * W.body + tableS * W.tables);
}

async function main() {
  // source-url map per category (dash/case-normalized slug -> original URL casing)
  const urlBySlug = new Map();
  for (const cat of CATS) {
    try {
      const urls = (await readFile(`tools/importer/urls-${cat}.txt`, 'utf8')).split('\n').map((l) => l.trim()).filter(Boolean);
      urls.forEach((u) => urlBySlug.set(dashNorm(u.split('/').pop().replace(/\.html$/, '')), u));
    } catch (e) { /* no list for this cat */ }
  }

  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-blink-features=AutomationControlled', '--disable-dev-shm-usage', '--disable-gpu'] });
  const ctx = await browser.newContext({
    bypassCSP: true,
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    locale: 'en-US', timezoneId: 'America/Los_Angeles',
    extraHTTPHeaders: { 'Accept-Language': 'en-US,en;q=0.9', 'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"', 'sec-ch-ua-mobile': '?0', 'sec-ch-ua-platform': '"macOS"' },
  });
  const page = await ctx.newPage();

  const rows = [];
  for (const cat of CATS) {
    const files = (await readdir(`${PR}/${cat}`)).filter((f) => f.endsWith('.plain.html')).sort();
    for (const file of files) {
      const slug = file.replace(/\.plain\.html$/, '');
      const mig = extractMigrated(await readFile(`${PR}/${cat}/${file}`, 'utf8'));
      let existingUrl = urlBySlug.get(dashNorm(slug)) || `${SRC}/${cat}/${slug}.html`;
      const previewUrl = `${PREVIEW}/${cat}/${slug}`;
      // The importer collapsed some source double-dashes (e.g. "with--48" -> "with-48").
      // If the reconstructed URL 404s, retry with a double dash before a $-amount
      // segment ("-48-" -> "--48-"), matching the source URL casing.
      const altUrl = existingUrl.replace(/-(\d+-million)/, '--$1');
      let src;
      let attempt = 0;
      while (attempt < 3) {
        attempt += 1;
        try {
          src = await extractSource(page, existingUrl);
          if (src.err && altUrl !== existingUrl) {
            const alt = await extractSource(page, altUrl);
            if (!alt.err) { src = alt; existingUrl = altUrl; }
          }
          if (!src.err) break;
        } catch (e) { src = { err: e.message }; }
        await page.waitForTimeout(1500 * attempt);
      }
      const q = src.err ? '' : quality(mig, src);
      rows.push({ title: mig.title, category: CAT_LABEL[cat], existingUrl, previewUrl, quality: q, err: src.err });
      console.log(`${q === '' ? 'ERR' : q}\t${cat}/${slug}${src.err ? ` (${src.err})` : ''}`);
      await page.waitForTimeout(300);
    }
  }
  await browser.close();

  const wb = new ExcelJS.Workbook();
  wb.creator = 'EDS Migration';
  wb.created = new Date();
  const brown = 'FF351C15';
  const ws = wb.addWorksheet('Press Releases');
  ws.columns = [
    { header: 'Title', key: 'title', width: 70 },
    { header: 'Category', key: 'category', width: 26 },
    { header: 'Existing page URL', key: 'existingUrl', width: 95 },
    { header: 'Migrated Page - Preview URL', key: 'previewUrl', width: 95 },
    { header: 'Page Quality (out of 100)', key: 'quality', width: 22 },
  ];
  ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: brown } };
  ws.views = [{ state: 'frozen', ySplit: 1 }];
  rows.forEach((r) => {
    const row = ws.addRow(r);
    row.getCell('existingUrl').value = { text: r.existingUrl, hyperlink: r.existingUrl };
    row.getCell('previewUrl').value = { text: r.previewUrl, hyperlink: r.previewUrl };
    ['existingUrl', 'previewUrl'].forEach((k) => { row.getCell(k).font = { color: { argb: 'FF0662BB' }, underline: true }; });
    const c = row.getCell('quality');
    c.alignment = { horizontal: 'center' };
    if (typeof r.quality === 'number') {
      const argb = r.quality >= 95 ? 'FFC6EFCE' : r.quality >= 85 ? 'FFFFEB9C' : 'FFFFC7CE';
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb } };
    } else {
      c.value = r.err ? `source unavailable (${r.err})` : 'n/a';
    }
  });
  ws.autoFilter = { from: 'A1', to: 'E1' };

  const out = 'content/press-releases-migrated-details.xlsx';
  await wb.xlsx.writeFile(out);
  const scored = rows.filter((r) => typeof r.quality === 'number').map((r) => r.quality);
  const avg = scored.length ? Math.round(scored.reduce((a, b) => a + b, 0) / scored.length) : 0;
  console.log(`\nWrote ${out} | ${rows.length} pages | scored ${scored.length} | avg ${avg} | source errors ${rows.length - scored.length}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
