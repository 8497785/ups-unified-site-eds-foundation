/* eslint-disable no-console */
/**
 * Extract content/structural fidelity fields from each migrated .plain.html so
 * they can be compared against the original source page (extracted separately
 * via the browser). Writes /tmp/migrated-fields.json keyed by
 * "<category>/<slug>".
 *
 * Fields (content-structural critique — styling excluded, no brand.css):
 *   title       article H1 text
 *   description short subtext/description
 *   category    eyebrow label
 *   hasImage    hero image present
 *   bodyChars   length of body rich text (proxy for body completeness)
 *   bodyParas   count of block-level body nodes
 */
import { readFile, readdir, writeFile } from 'fs/promises';

const SKILL = '/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts/node_modules';
const { JSDOM } = await import(`${SKILL}/jsdom/lib/api.js`);

const BASE = 'content/language-masters/en/newsroom/press-releases';
const CATS = ['customer-first', 'financials', 'innovation-driven',
  'local-community-engagement', 'our-strategy', 'people-led', 'sustainable-services'];

const text = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');

const out = {};
for (const cat of CATS) {
  // eslint-disable-next-line no-await-in-loop
  const files = (await readdir(`${BASE}/${cat}`)).filter((f) => f.endsWith('.plain.html'));
  for (const file of files) {
    const slug = file.replace(/\.plain\.html$/, '');
    // eslint-disable-next-line no-await-in-loop
    const html = await readFile(`${BASE}/${cat}/${file}`, 'utf8');
    const { document } = new JSDOM(html).window;
    const header = document.querySelector('.article-header');
    const cells = header ? [...header.querySelectorAll(':scope > div > div')] : [];
    const byField = {};
    cells.forEach((c) => {
      const m = c.innerHTML.match(/<!--\s*field:(\w+)\s*-->/);
      if (m) byField[m[1]] = c;
    });
    const colBody = document.querySelector('.column-control .cmp-text, .column-control');
    // body text is the first column's text node in the column-control
    let bodyText = '';
    let bodyParas = 0;
    const col = document.querySelector('.column-control > div > div');
    if (col) {
      bodyText = text(col);
      bodyParas = col.querySelectorAll('p, ul, ol, h2, h3, table').length;
    }
    out[`${cat}/${slug}`] = {
      title: text(byField.title),
      description: text(byField.description),
      category: text(byField.eyebrow),
      hasImage: !!document.querySelector('picture img, img'),
      bodyChars: bodyText.length,
      bodyParas,
    };
  }
}
await writeFile('/tmp/migrated-fields.json', JSON.stringify(out, null, 2));
console.log('migrated pages extracted:', Object.keys(out).length);
