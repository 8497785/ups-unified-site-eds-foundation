/* eslint-disable */
/**
 * Excel report for the 2 migrated governance pages (Carbon Neutral Credentials, Transparency Rule): page details + the
 * content & structural critique (excat-visual-critique, content-structural-only).
 *
 * Input:  latest migration-work/critique/governance_<ts>/summary.json
 *         (produced by migration-work/critique-governance.mjs)
 * Output: content/governance-migration-critique-report.xlsx
 *
 * Usage: node tools/importer/build-governance-critique-report.mjs
 */
import { readFileSync, readdirSync } from 'fs';

const NM = '/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts/node_modules';
const require = (await import('module')).createRequire(import.meta.url);
const ExcelJS = require(`${NM}/exceljs/excel.js`);

const session = readdirSync('migration-work/critique').filter((d) => d.startsWith('governance_')).sort().pop();
const pages = JSON.parse(readFileSync(`migration-work/critique/${session}/summary.json`, 'utf8'));

const RELATED = JSON.parse(readFileSync('tools/importer/related-stories-governance.json', 'utf8'));
const BROWN = 'FF351C15';
const PASS = 90;
const FIX = {
  'broken-link': 'Point the Article Header category link at the us/en Statements page (re-pick it in Universal Editor, or roll the page out from Language Masters so the link is rewritten).',
  'missing-text': 'Re-import the page with the current parser (it now reads every text block, including bare text) and reinstall its package.',
  'missing-link': 'Restored together with the missing text above (same re-import).',
};
const label = { 'broken-link': 'Broken category link', 'missing-text': 'Missing body text', 'missing-link': 'Missing link' };

const wb = new ExcelJS.Workbook();
wb.creator = 'EDS Migration';
wb.created = new Date();
const header = (ws) => {
  const r = ws.getRow(1);
  r.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  r.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BROWN } };
  r.alignment = { vertical: 'middle', wrapText: true };
  ws.views = [{ state: 'frozen', ySplit: 1 }];
};
const link = (cell, url) => { cell.value = { text: url, hyperlink: url }; cell.font = { color: { argb: 'FF0662BB' }, underline: true }; };

// ---- Sheet 1: page details + score --------------------------------------
const ws = wb.addWorksheet('Governance Pages');
ws.columns = [
  { header: '#', key: 'n', width: 5 },
  { header: 'Title', key: 'title', width: 50 },
  { header: 'Category', key: 'category', width: 12 },
  { header: 'Published Date', key: 'date', width: 14 },
  { header: 'Description', key: 'description', width: 45 },
  { header: 'Existing page URL', key: 'orig', width: 60 },
  { header: 'Migrated Page - Preview URL', key: 'mig', width: 60 },
  { header: 'Preview Status', key: 'status', width: 10 },
  { header: 'Hero Image', key: 'hero', width: 14 },
  { header: 'Body Paragraphs (original / migrated)', key: 'paras', width: 16 },
  { header: 'List Items (original / migrated)', key: 'lists', width: 14 },
  { header: 'Tables', key: 'tables', width: 8 },
  { header: 'Video', key: 'video', width: 8 },
  { header: 'Social Share', key: 'share', width: 10 },
  { header: 'Related Stories', key: 'related', width: 60 },
  { header: 'Category Link (migrated)', key: 'eyebrow', width: 44 },
  { header: 'Migrated Layout', key: 'layout', width: 34 },
  { header: 'Content & Structure Score (out of 100)', key: 'score', width: 16 },
  { header: 'Result', key: 'result', width: 12 },
  { header: 'Issues Found', key: 'issues', width: 60 },
];
header(ws);
pages.forEach((p, i) => {
  const ok = p.similarity >= PASS && !p.diffs.length;
  const row = ws.addRow({
    n: i + 1,
    title: p.title,
    category: p.category || 'Governance',
    date: p.date || 'None on source',
    description: p.description,
    status: p.migratedStatus,
    hero: p.orig && p.mig && p.orig.images === p.mig.images ? 'Migrated' : 'Missing',
    paras: p.orig ? `${p.orig.paragraphs} / ${p.mig.paragraphs}` : '',
    lists: p.orig ? `${p.orig.listItems} / ${p.mig.listItems}` : '',
    tables: p.orig ? p.orig.tables : '',
    video: p.orig && p.orig.video ? 'Yes' : 'No',
    share: p.mig && p.mig.socialShare ? 'Yes' : 'No',
    related: RELATED[p.migratedSlug] ? `Related Articles (Static), 3 paths saved: ${RELATED[p.migratedSlug].map((x) => x.split('/').pop()).join(', ')}. Hidden until those stories are migrated.` : 'None on source',
    eyebrow: p.mig ? p.mig.eyebrowHref : '',
    layout: p.mig ? p.mig.layout : '',
    score: p.similarity,
    result: ok ? 'Pass' : 'Needs fix',
    issues: p.diffs.length ? p.diffs.map((d) => `• ${label[d.type] || d.type}: ${d.description}`).join('\n') : 'None',
  });
  link(row.getCell('orig'), p.originalUrl);
  link(row.getCell('mig'), p.migratedUrl);
  row.alignment = { vertical: 'top', wrapText: true };
  row.getCell('result').font = { bold: true, color: { argb: ok ? 'FF1E7B34' : 'FFB00020' } };
  row.getCell('score').font = { bold: true };
});
ws.autoFilter = { from: 'A1', to: 'T1' };

// ---- Sheet 2: one row per critique issue ---------------------------------
const is = wb.addWorksheet('Critique Issues');
is.columns = [
  { header: '#', key: 'n', width: 5 },
  { header: 'Page', key: 'page', width: 48 },
  { header: 'Migrated Page - Preview URL', key: 'url', width: 60 },
  { header: 'Category', key: 'cat', width: 12 },
  { header: 'Issue Type', key: 'type', width: 22 },
  { header: 'Severity', key: 'sev', width: 10 },
  { header: 'Details', key: 'desc', width: 70 },
  { header: 'Recommended Fix', key: 'fix', width: 70 },
];
header(is);
let n = 0;
pages.forEach((p) => p.diffs.forEach((d) => {
  const row = is.addRow({ n: ++n, page: p.title, cat: d.type === 'missing-block' ? 'Structural' : 'Content', type: label[d.type] || d.type, sev: d.severity === 'high' ? 'High' : d.severity, desc: d.description, fix: FIX[d.type] || '' });
  link(row.getCell('url'), p.migratedUrl);
  row.alignment = { vertical: 'top', wrapText: true };
}));
if (!n) is.addRow({ n: '', page: 'No issues found' });
is.autoFilter = { from: 'A1', to: 'H1' };

// ---- Sheet 3: summary + method -------------------------------------------
const sm = wb.addWorksheet('Summary');
sm.columns = [{ header: 'Item', key: 'k', width: 44 }, { header: 'Value', key: 'v', width: 100 }];
header(sm);
const scores = pages.map((p) => p.similarity);
const byType = {};
pages.forEach((p) => p.diffs.forEach((d) => { byType[label[d.type] || d.type] = (byType[label[d.type] || d.type] || 0) + 1; }));
[
  ['Pages checked', pages.length],
  ['Preview status', 'Package not installed yet: the migrated side is the imported page content the package is built from. The preview URLs work once governance-pages.zip is installed and the pages are rolled out and published.'],
  ['Average Content & Structure Score', +(scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)],
  ['Pages passing (score ≥ 90 and no issues)', pages.filter((p) => p.similarity >= PASS && !p.diffs.length).length],
  ['Pages needing a fix', pages.filter((p) => !(p.similarity >= PASS && !p.diffs.length)).length],
  ...Object.entries(byType).map(([k, v]) => [`Issues — ${k}`, `${v} page(s)`]),
  ['', ''],
  ['Pages with video', pages.filter((p) => p.orig && p.orig.video).length],
  ['Pages with tables', pages.filter((p) => p.orig && p.orig.tables).length],
  ['Related Stories', 'Carbon Neutral Credentials: Related Articles (Static) with the 3 sustainability stories saved as Language Masters paths. The section stays hidden until those stories are migrated and published, then fills in with no re-authoring (needs PR #10).'],
  ['Known difference (not scored)', 'Transparency Rule read time: source "LESS THAN A MINUTE", migrated "1 MIN READ" (site-wide minimum of 1 minute).'],
  ['', ''],
  ['Critique type', 'Content & structure (styling not scored — the project has no design-token file for the styling comparison).'],
  ['What was compared', 'Original article area on about.ups.com vs the migrated page content: title/headings, body paragraphs, bullet lists, every sentence of body text, links, images, tables, video, breadcrumb, article header, social share, and the category link target.'],
  ['Scoring', 'Each missing or broken item weighs 5. Score = 100 − (total weight ÷ max(items checked × 2, 20) × 100). Pass = 90 or above with no content/structure issues.'],
  ['Critique data', `migration-work/critique/${session}/ (per-page extraction + critique-diffs.json)`],
  ['Generated', new Date().toISOString().slice(0, 10)],
].forEach(([k, v]) => { const r = sm.addRow({ k, v }); r.alignment = { vertical: 'top', wrapText: true }; });

const out = 'content/governance-migration-critique-report.xlsx';
await wb.xlsx.writeFile(out);
console.log(`Wrote ${out} | pages ${pages.length} | issues ${n} | session ${session}`);
