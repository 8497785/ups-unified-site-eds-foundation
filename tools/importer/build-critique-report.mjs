/* eslint-disable no-console */
/**
 * Build an Excel critique report for all migrated press-release pages.
 *
 * Content/structural critique (styling excluded — no brand.css / design
 * migration): each migrated page (from its imported .plain.html) is compared
 * against the original source page (extracted from about.ups.com) on weighted
 * fidelity dimensions:
 *   Title        30%  exact/normalized title match
 *   Description  15%  description match (both blank counts as match)
 *   Category     15%  eyebrow/category match
 *   Image        10%  hero image present on both
 *   Body         30%  body completeness (migrated bodyChars / source bodyChars)
 * Weighted sum -> per-page score (0-100). Sheet 1 = per-page rows, Sheet 2 =
 * per-category + overall summary.
 */
import { readFile } from 'fs/promises';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const SKILL = '/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts/node_modules';
const ExcelJS = require(`${SKILL}/exceljs/excel.js`);

const migrated = JSON.parse(await readFile('/tmp/migrated-fields.json', 'utf8'));
const source = JSON.parse(await readFile('/tmp/source-fields.json', 'utf8'));

const BASE_PREVIEW = 'https://main--ups-unified-site-eds-foundation--8497785.aem.page/us/en/newsroom/press-releases';

const norm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const W = {
  title: 30, description: 15, category: 15, image: 10, body: 30,
};

function scorePage(mig, src) {
  const notes = [];
  // Title
  const titleScore = norm(mig.title) && norm(mig.title) === norm(src.title) ? 1
    : (norm(mig.title) && norm(src.title) && (norm(mig.title).includes(norm(src.title)) || norm(src.title).includes(norm(mig.title))) ? 0.9 : (norm(mig.title) ? 0.5 : 0));
  if (titleScore < 1) notes.push('title differs');
  // Description (both empty = full match)
  let descScore;
  if (!norm(src.description) && !norm(mig.description)) descScore = 1;
  else if (norm(mig.description) === norm(src.description)) descScore = 1;
  else if (norm(mig.description) && norm(src.description)) descScore = 0.8;
  else { descScore = 0; notes.push('description missing'); }
  // Category
  const catScore = norm(mig.category) && norm(mig.category) === norm(src.category) ? 1
    : (norm(mig.category) ? 0.5 : 0);
  if (catScore < 1) notes.push('category differs');
  // Image
  const imgScore = (mig.hasImage && src.hasImage) ? 1 : (!src.hasImage ? 1 : 0);
  if (imgScore < 1) notes.push('image missing');
  // Body completeness ratio (cap at 1)
  const ratio = src.bodyChars > 0 ? Math.min(1, mig.bodyChars / src.bodyChars) : (mig.bodyChars > 0 ? 1 : 0);
  const bodyScore = ratio;
  if (ratio < 0.98) notes.push(`body ${(ratio * 100).toFixed(0)}% of source`);

  const total = titleScore * W.title + descScore * W.description + catScore * W.category
    + imgScore * W.image + bodyScore * W.body;
  return {
    score: Math.round(total),
    titleScore, descScore, catScore, imgScore, bodyScore, ratio, notes,
  };
}

const rows = [];
for (const key of Object.keys(migrated).sort()) {
  const [cat, ...rest] = key.split('/');
  const slug = rest.join('/');
  const mig = migrated[key];
  const src = source[key] || {};
  if (src.err) {
    rows.push({
      cat, slug, key, score: '', note: `source fetch error: ${src.err}`, mig, src,
    });
    continue;
  }
  const s = scorePage(mig, src);
  rows.push({
    cat,
    slug,
    key,
    previewUrl: `${BASE_PREVIEW}/${slug}`,
    migTitle: mig.title,
    srcTitle: src.title,
    score: s.score,
    titlePct: Math.round(s.titleScore * 100),
    descPct: Math.round(s.descScore * 100),
    catPct: Math.round(s.catScore * 100),
    imgPct: Math.round(s.imgScore * 100),
    bodyPct: Math.round(s.bodyScore * 100),
    bodyRatio: `${Math.round(s.ratio * 100)}%`,
    notes: s.notes.join('; ') || 'exact match',
  });
}

// ---- workbook ----
const wb = new ExcelJS.Workbook();
wb.creator = 'EDS Migration';
wb.created = new Date();

const ws = wb.addWorksheet('Page Scores');
ws.columns = [
  { header: 'Category', key: 'cat', width: 26 },
  { header: 'Page (slug)', key: 'slug', width: 60 },
  { header: 'Critique Score', key: 'score', width: 14 },
  { header: 'Title %', key: 'titlePct', width: 9 },
  { header: 'Desc %', key: 'descPct', width: 9 },
  { header: 'Category %', key: 'catPct', width: 11 },
  { header: 'Image %', key: 'imgPct', width: 9 },
  { header: 'Body %', key: 'bodyPct', width: 9 },
  { header: 'Body vs Source', key: 'bodyRatio', width: 14 },
  { header: 'Notes', key: 'notes', width: 40 },
  { header: 'Migrated Title', key: 'migTitle', width: 60 },
  { header: 'Preview URL', key: 'previewUrl', width: 90 },
];
ws.getRow(1).font = { bold: true };
ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF351C15' } };
ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
ws.views = [{ state: 'frozen', ySplit: 1 }];

rows.forEach((r) => {
  const row = ws.addRow(r);
  const sc = typeof r.score === 'number' ? r.score : null;
  if (sc !== null) {
    const c = row.getCell('score');
    const argb = sc >= 95 ? 'FFC6EFCE' : sc >= 85 ? 'FFFFEB9C' : 'FFFFC7CE';
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb } };
    c.alignment = { horizontal: 'center' };
  }
});
ws.autoFilter = { from: 'A1', to: 'L1' };

// ---- summary sheet ----
const sum = wb.addWorksheet('Summary');
sum.columns = [
  { header: 'Category', key: 'cat', width: 28 },
  { header: 'Pages', key: 'n', width: 10 },
  { header: 'Avg Score', key: 'avg', width: 12 },
  { header: 'Min', key: 'min', width: 8 },
  { header: 'Max', key: 'max', width: 8 },
  { header: 'Pages ≥95', key: 'high', width: 12 },
];
sum.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
sum.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF351C15' } };

const byCat = {};
rows.forEach((r) => {
  if (typeof r.score !== 'number') return;
  (byCat[r.cat] = byCat[r.cat] || []).push(r.score);
});
const allScores = [];
Object.keys(byCat).sort().forEach((cat) => {
  const arr = byCat[cat];
  allScores.push(...arr);
  sum.addRow({
    cat,
    n: arr.length,
    avg: Math.round(arr.reduce((a, b) => a + b, 0) / arr.length),
    min: Math.min(...arr),
    max: Math.max(...arr),
    high: arr.filter((s) => s >= 95).length,
  });
});
const totalRow = sum.addRow({
  cat: 'ALL PRESS RELEASES',
  n: allScores.length,
  avg: Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length),
  min: Math.min(...allScores),
  max: Math.max(...allScores),
  high: allScores.filter((s) => s >= 95).length,
});
totalRow.font = { bold: true };

// ---- methodology note ----
const note = wb.addWorksheet('Methodology');
note.columns = [{ header: 'Critique Methodology', key: 't', width: 120 }];
note.getRow(1).font = { bold: true };
[
  'Scope: Content & structural fidelity critique of each migrated page vs its original about.ups.com source.',
  'Styling/visual pixel critique is NOT included (design migration / brand.css has not been run for this project).',
  'Migrated data is read from the imported .plain.html; source data is extracted live from about.ups.com.',
  'Weighted dimensions: Title 30%, Description 15%, Category 15%, Image 10%, Body completeness 30%.',
  'Body completeness = migrated body text length / source body text length (capped at 100%).',
  'Score bands: green ≥95 (faithful), amber 85-94 (minor gaps), red <85 (review).',
  `Generated: ${new Date().toISOString().slice(0, 10)} — 167 published press-release pages across 7 categories.`,
].forEach((t) => note.addRow({ t }));

const outPath = 'content/press-releases-critique-report.xlsx';
await wb.xlsx.writeFile(outPath);
const nums = rows.filter((r) => typeof r.score === 'number').map((r) => r.score);
console.log(`Wrote ${outPath}`);
console.log(`Pages: ${rows.length} | Avg score: ${Math.round(nums.reduce((a, b) => a + b, 0) / nums.length)} | Min ${Math.min(...nums)} | Max ${Math.max(...nums)}`);
