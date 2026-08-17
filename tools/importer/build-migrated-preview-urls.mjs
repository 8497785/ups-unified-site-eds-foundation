/* eslint-disable no-console, import/no-dynamic-require, global-require, max-len, no-restricted-syntax, no-await-in-loop, no-unused-vars, object-curly-newline */
/**
 * Build an Excel report of every migrated newsroom page with its preview URL.
 *
 * Walks content/language-masters/en/newsroom for *.plain.html, reads each
 * page's title from the article-header, and maps the authoring path to the
 * delivered .aem.page (us/en) preview URL. One row per page; sheet grouped by
 * category with a summary.
 *
 * Output: content/migrated-pages-preview-urls.xlsx
 */
import { readFile, readdir, writeFile } from 'fs/promises';
import { join } from 'path';

const SKILL = '/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts/node_modules';
const { JSDOM } = await import(`${SKILL}/jsdom/lib/api.js`);
const require = (await import('module')).createRequire(import.meta.url);
const ExcelJS = require(`${SKILL}/exceljs/excel.js`);

const ROOT = 'content/language-masters/en/newsroom';
const PREVIEW_BASE = 'https://main--ups-unified-site-eds-foundation--8497785.aem.page/us/en/newsroom';
const text = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');

// Recursively collect *.plain.html under a dir, returning paths relative to ROOT.
async function collect(dir, rel = '') {
  const out = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = join(dir, e.name);
    const r = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) out.push(...await collect(full, r));
    else if (e.name.endsWith('.plain.html')) out.push(r);
  }
  return out;
}

async function main() {
  const files = (await collect(ROOT)).sort();
  const rows = [];
  for (const rel of files) {
    const relNoExt = rel.replace(/\.plain\.html$/, '');
    const parts = relNoExt.split('/');
    const slug = parts.pop();
    const category = parts.length ? parts.join('/') : '(newsroom root)';
    const html = await readFile(`${ROOT}/${rel}`, 'utf8');
    const { document } = new JSDOM(html).window;
    const title = text(document.querySelector('.article-header h1')) || text(document.querySelector('h1'));
    rows.push({ category, slug, title, url: `${PREVIEW_BASE}/${relNoExt}` });
  }
  rows.sort((a, b) => (a.category.localeCompare(b.category) || a.slug.localeCompare(b.slug)));

  const wb = new ExcelJS.Workbook();
  wb.creator = 'EDS Migration';
  wb.created = new Date();
  const brown = 'FF351C15';

  const ws = wb.addWorksheet('Preview URLs');
  ws.columns = [
    { header: '#', key: 'n', width: 6 },
    { header: 'Category', key: 'category', width: 34 },
    { header: 'Title', key: 'title', width: 70 },
    { header: 'Page (slug)', key: 'slug', width: 55 },
    { header: 'Preview URL', key: 'url', width: 105 },
  ];
  ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: brown } };
  ws.views = [{ state: 'frozen', ySplit: 1 }];
  rows.forEach((r, i) => {
    const row = ws.addRow({ ...r, n: i + 1 });
    row.getCell('url').value = { text: r.url, hyperlink: r.url };
    row.getCell('url').font = { color: { argb: 'FF0662BB' }, underline: true };
  });
  ws.autoFilter = { from: 'A1', to: 'E1' };

  const sum = wb.addWorksheet('Summary');
  sum.columns = [{ header: 'Category', key: 'c', width: 40 }, { header: 'Pages', key: 'n', width: 12 }];
  sum.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  sum.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: brown } };
  const byCat = {};
  rows.forEach((r) => { byCat[r.category] = (byCat[r.category] || 0) + 1; });
  Object.keys(byCat).sort().forEach((c) => sum.addRow({ c, n: byCat[c] }));
  const total = sum.addRow({ c: 'TOTAL', n: rows.length });
  total.font = { bold: true };

  const out = 'content/migrated-pages-preview-urls.xlsx';
  await wb.xlsx.writeFile(out);
  console.log(`Wrote ${out} | ${rows.length} pages across ${Object.keys(byCat).length} categories`);
  Object.keys(byCat).sort().forEach((c) => console.log(`  ${byCat[c]}\t${c}`));
}

main().catch((e) => { console.error(e); process.exit(1); });
