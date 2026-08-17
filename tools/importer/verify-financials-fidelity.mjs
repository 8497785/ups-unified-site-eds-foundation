/* eslint-disable no-console, no-await-in-loop, no-restricted-syntax, import/no-dynamic-require, global-require, max-len, object-curly-newline, object-property-newline, no-continue, no-nested-ternary, no-unused-vars */
/**
 * Content-fidelity verification for the migrated financials press-release pages
 * vs their original about.ups.com source pages. Writes an Excel report.
 *
 * For each page it compares (content/structural — styling excluded):
 *   title        article headline
 *   description  short subtext / meta description
 *   category     eyebrow label
 *   date         article date
 *   image        hero image present
 *   bodyChars    body text length (proxy for body completeness)
 *   tables       number of data tables
 *
 * Migrated data: read from the imported .plain.html.
 * Source data:   fetched live from about.ups.com via a stealth browser.
 *
 * Output: content/financials-content-verification.xlsx
 */
import { readFile, readdir, writeFile } from 'fs/promises';

const SKILL = '/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts/node_modules';
const { JSDOM } = await import(`${SKILL}/jsdom/lib/api.js`);
const pw = await import(`${SKILL}/playwright/index.js`);
const chromium = pw.chromium || pw.default.chromium;
const { createRequire } = await import('module');
const require = createRequire(import.meta.url);
const ExcelJS = require(`${SKILL}/exceljs/excel.js`);

const DIR = 'content/language-masters/en/newsroom/press-releases/financials';
const URLS_FILE = 'tools/importer/urls-financials.txt';
const norm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const dashNorm = (s) => (s || '').toLowerCase().replace(/-+/g, '-').replace(/^-|-$/g, '');
const text = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');

// ---- migrated extraction (imported .plain.html) ----
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
  let bodyChars = 0;
  let tables = 0;
  if (col) {
    bodyChars = text(col).length;
    tables = col.querySelectorAll('table').length;
  }
  const metaRows = [...document.querySelectorAll('.metadata > div')];
  const descRow = metaRows.find((r) => (r.firstElementChild?.textContent || '').trim().toLowerCase() === 'description');
  return {
    title: text(byField.title) || text(document.querySelector('h1')),
    description: text(byField.description) || (descRow ? text(descRow.children[1]) : ''),
    category: text(byField.eyebrow),
    date: text(byField.articleDate),
    hasImage: !!document.querySelector('picture img, img'),
    bodyChars,
    tables,
  };
}

// ---- source extraction (live about.ups.com) ----
async function extractSource(page, url) {
  const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
  const title = await page.title();
  if (title === 'Access Denied' || (resp && resp.status() >= 400)) {
    return { err: `HTTP ${resp ? resp.status() : '?'}${title === 'Access Denied' ? ' Access Denied' : ''}` };
  }
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1000);
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

// ---- scoring ----
const W = { title: 25, description: 15, category: 10, date: 10, image: 10, body: 20, tables: 10 };
function score(mig, src) {
  const notes = [];
  const titleS = norm(mig.title) && norm(mig.title) === norm(src.title) ? 1
    : (norm(mig.title) && norm(src.title) && (norm(mig.title).includes(norm(src.title)) || norm(src.title).includes(norm(mig.title))) ? 0.9 : (norm(mig.title) ? 0.5 : 0));
  if (titleS < 1) notes.push('title differs');
  let descS;
  if (!norm(src.description) && !norm(mig.description)) descS = 1;
  else if (norm(mig.description) === norm(src.description)) descS = 1;
  else if (norm(mig.description) && norm(src.description)) descS = 0.8;
  else { descS = 0; notes.push('description missing'); }
  const catS = norm(mig.category) && norm(mig.category) === norm(src.category) ? 1 : (norm(mig.category) ? 0.6 : 0);
  if (catS < 1) notes.push('category differs');
  const dateS = norm(mig.date) && norm(mig.date) === norm(src.date) ? 1 : (norm(mig.date) ? 0.6 : (norm(src.date) ? 0 : 1));
  if (dateS < 1) notes.push('date differs');
  const imgS = (mig.hasImage && src.hasImage) ? 1 : (!src.hasImage ? 1 : 0);
  if (imgS < 1) notes.push('image missing');
  const ratio = src.bodyChars > 0 ? Math.min(1, mig.bodyChars / src.bodyChars) : (mig.bodyChars > 0 ? 1 : 0);
  if (ratio < 0.98) notes.push(`body ${(ratio * 100).toFixed(0)}% of source`);
  const tableS = src.tables === mig.tables ? 1 : (src.tables > 0 ? Math.min(1, mig.tables / src.tables) : 1);
  if (tableS < 1) notes.push(`tables ${mig.tables}/${src.tables}`);
  const total = titleS * W.title + descS * W.description + catS * W.category + dateS * W.date + imgS * W.image + ratio * W.body + tableS * W.tables;
  return { score: Math.round(total), titleS, descS, catS, dateS, imgS, ratio, tableS, notes };
}

async function main() {
  // Map each imported slug -> source URL (match by dash/case-normalized slug).
  const urls = (await readFile(URLS_FILE, 'utf8')).split('\n').map((l) => l.trim()).filter(Boolean);
  const urlBySlug = new Map();
  urls.forEach((u) => {
    const slug = dashNorm(u.split('/').pop().replace(/\.html$/, ''));
    urlBySlug.set(slug, u);
  });

  const files = (await readdir(DIR)).filter((f) => f.endsWith('.plain.html')).sort();
  console.log(`Financials pages: ${files.length}`);

  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-blink-features=AutomationControlled', '--disable-dev-shm-usage', '--disable-gpu'] });
  const ctx = await browser.newContext({
    bypassCSP: true,
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    locale: 'en-US',
    timezoneId: 'America/Los_Angeles',
    extraHTTPHeaders: { 'Accept-Language': 'en-US,en;q=0.9', 'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"', 'sec-ch-ua-mobile': '?0', 'sec-ch-ua-platform': '"macOS"' },
  });
  const page = await ctx.newPage();

  const rows = [];
  for (const file of files) {
    const slug = file.replace(/\.plain\.html$/, '');
    const mig = extractMigrated(await readFile(`${DIR}/${file}`, 'utf8'));
    const url = urlBySlug.get(dashNorm(slug)) || `https://about.ups.com/us/en/newsroom/press-releases/financials/${slug}.html`;
    let src;
    let attempt = 0;
    // retry up to 3x for transient WAF blocks
    while (attempt < 3) {
      attempt += 1;
      try {
        src = await extractSource(page, url);
        if (!src.err) break;
      } catch (e) { src = { err: e.message }; }
      await page.waitForTimeout(1500 * attempt);
    }
    if (src.err) {
      rows.push({ slug, url, status: `SOURCE ERROR: ${src.err}`, mig });
      console.log(`ERR ${slug}: ${src.err}`);
      continue;
    }
    const s = score(mig, src);
    rows.push({ slug, url, mig, src, s });
    console.log(`${s.score}  ${slug}${s.notes.length ? '  (' + s.notes.join('; ') + ')' : ''}`);
    await page.waitForTimeout(400);
  }
  await browser.close();

  // ---- workbook ----
  const wb = new ExcelJS.Workbook();
  wb.creator = 'EDS Migration';
  wb.created = new Date();
  const brown = 'FF351C15';

  const ws = wb.addWorksheet('Content Verification');
  ws.columns = [
    { header: 'Page (slug)', key: 'slug', width: 58 },
    { header: 'Score', key: 'score', width: 8 },
    { header: 'Title %', key: 'titlePct', width: 8 },
    { header: 'Desc %', key: 'descPct', width: 8 },
    { header: 'Category %', key: 'catPct', width: 10 },
    { header: 'Date %', key: 'datePct', width: 8 },
    { header: 'Image %', key: 'imgPct', width: 8 },
    { header: 'Body %', key: 'bodyPct', width: 8 },
    { header: 'Tables (mig/src)', key: 'tables', width: 15 },
    { header: 'Notes', key: 'notes', width: 42 },
    { header: 'Migrated Title', key: 'migTitle', width: 55 },
    { header: 'Source URL', key: 'url', width: 95 },
  ];
  ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: brown } };
  ws.views = [{ state: 'frozen', ySplit: 1 }];

  rows.forEach((r) => {
    if (r.status) {
      const row = ws.addRow({ slug: r.slug, score: '', notes: r.status, migTitle: r.mig?.title || '', url: r.url });
      row.getCell('notes').font = { color: { argb: 'FFC00000' } };
      return;
    }
    const row = ws.addRow({
      slug: r.slug,
      score: r.s.score,
      titlePct: Math.round(r.s.titleS * 100),
      descPct: Math.round(r.s.descS * 100),
      catPct: Math.round(r.s.catS * 100),
      datePct: Math.round(r.s.dateS * 100),
      imgPct: Math.round(r.s.imgS * 100),
      bodyPct: Math.round(r.s.ratio * 100),
      tables: `${r.mig.tables} / ${r.src.tables}`,
      notes: r.s.notes.join('; ') || 'exact match',
      migTitle: r.mig.title,
      url: r.url,
    });
    const c = row.getCell('score');
    const argb = r.s.score >= 95 ? 'FFC6EFCE' : r.s.score >= 85 ? 'FFFFEB9C' : 'FFFFC7CE';
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb } };
    c.alignment = { horizontal: 'center' };
  });
  ws.autoFilter = { from: 'A1', to: 'L1' };

  // ---- summary ----
  const sum = wb.addWorksheet('Summary');
  sum.columns = [{ header: 'Metric', key: 'k', width: 34 }, { header: 'Value', key: 'v', width: 16 }];
  sum.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  sum.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: brown } };
  const scored = rows.filter((r) => !r.status).map((r) => r.s.score);
  const errs = rows.filter((r) => r.status).length;
  const avg = scored.length ? Math.round(scored.reduce((a, b) => a + b, 0) / scored.length) : 0;
  const tableRows = rows.filter((r) => !r.status && (r.src.tables > 0 || r.mig.tables > 0));
  const tableMatch = tableRows.filter((r) => r.mig.tables === r.src.tables).length;
  [
    ['Total financials pages', rows.length],
    ['Compared against live source', scored.length],
    ['Source fetch errors', errs],
    ['Average fidelity score', avg],
    ['Pages scoring >= 95', scored.filter((s) => s >= 95).length],
    ['Pages scoring 85-94', scored.filter((s) => s >= 85 && s < 95).length],
    ['Pages scoring < 85', scored.filter((s) => s < 85).length],
    ['Pages with tables', tableRows.length],
    ['Pages where table count matches source', tableMatch],
  ].forEach(([k, v]) => sum.addRow({ k, v }));

  const note = wb.addWorksheet('Methodology');
  note.columns = [{ header: 'Methodology', key: 't', width: 120 }];
  note.getRow(1).font = { bold: true };
  [
    'Content & structural fidelity of each migrated financials page vs its original about.ups.com source (styling excluded).',
    'Migrated data read from the imported .plain.html; source data fetched live from about.ups.com.',
    'Weighted: Title 25, Description 15, Category 10, Date 10, Image 10, Body completeness 20, Tables 10.',
    'Body completeness = migrated body text length / source body text length (capped 100%).',
    'Tables = count of data tables migrated vs source (migrated tables are now dedicated Table blocks).',
    'Score bands: green >=95, amber 85-94, red <85.',
  ].forEach((t) => note.addRow({ t }));

  const out = 'content/financials-content-verification.xlsx';
  await wb.xlsx.writeFile(out);
  console.log(`\nWrote ${out} | pages ${rows.length} | avg ${avg} | source errors ${errs}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
