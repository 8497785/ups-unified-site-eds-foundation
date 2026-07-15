/* eslint-disable no-console */
/**
 * Deterministic package builder for the press-release / article page.
 *
 * WHY THIS EXISTS (and is built from scratch, not via md->JCR):
 * The generic md->JCR converter only builds a real columns node when the block
 * header text starts with "columns" (helix-md2jcr mdast-columns-block.js), and
 * html2md strips the .column-control wrapper entirely. Our block is titled
 * "Column Control", so that path collapses the two-column layout and drops the
 * nested social-share block. This script builds the entire upload package
 * straight from the imported .plain.html so the layout survives intact and the
 * result is repeatable — no hand-authoring.
 *
 * WHAT IT PRODUCES (complete, self-contained — nothing pre-exists on disk):
 *   migration-work/packages/
 *     jcr/jcr_root/content/about-ups-eds/<parents>/.content.xml   (titled pages)
 *     jcr/jcr_root/content/about-ups-eds/<parents>/<leaf>/.content.xml
 *     jcr/META-INF/vault/filter.xml         (leaf = full; parents = jcr:content only)
 *     jcr/META-INF/vault/properties.xml
 *     about-ups-eds-manifest.json           (assetDamPath = /content/dam — NO about-ups-eds)
 *     asset-mapping.json
 *     about-ups-eds.zip                      (the uploadable package)
 *
 * IMAGE RULE (the whole reason the last upload was wrong):
 *   - The .content.xml stores the FINAL AEM path: /content/dam/upsstories/...
 *     (host stripped, NO about-ups-eds segment).
 *   - The manifest's assetDamPath is /content/dam. The upload tool copies each
 *     source image into the DAM at assetDamPath + (path after /content/dam), so
 *     /content/dam/upsstories/X stays /content/dam/upsstories/X. Setting
 *     assetDamPath to /content/dam/about-ups-eds (the old bug) is what injected
 *     the about-ups-eds segment into every image reference on upload.
 *
 * PARENT TITLES (the reason parent titles never showed):
 *   The old filter.xml listed only the leaf page as a root, so the parent
 *   .content.xml titles were written but never imported. Here every parent is a
 *   filter root scoped to its jcr:content node — the title updates without
 *   touching (deleting) the parent's other child pages.
 *
 * Usage: node tools/importer/generate-article-jcr.mjs
 */
import {
  readFile, writeFile, mkdir, rm, readdir,
} from 'fs/promises';
import { createWriteStream } from 'fs';
import { dirname, join } from 'path';

const SKILL = '/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts/node_modules';
const { JSDOM } = await import(`${SKILL}/jsdom/lib/api.js`);
const archiver = (await import(`${SKILL}/archiver/index.js`)).default;

// ---- constants -------------------------------------------------------------
const SITE = 'about-ups-eds';
// All article pages live under this folder. The generator discovers every
// imported *.plain.html here and packages each as its own leaf page, so one
// zip can carry any number of pages (re-running is idempotent per page).
const ARTICLES_DIR = 'language-masters/en/newsroom/press-releases/customer-first';

const PKG_BASE = 'migration-work/packages';
const JCR_ROOT = `${PKG_BASE}/jcr/jcr_root`;
const CONTENT_BASE = `${JCR_ROOT}/content/${SITE}`;
const META_DIR = `${PKG_BASE}/jcr/META-INF/vault`;
const CONTENT_PATH = `/content/${SITE}`; // AEM path prefix

// Intermediate parent pages -> jcr:title. language-masters / en are structural.
const PARENTS = [
  ['language-masters', 'Language Masters'],
  ['language-masters/en', 'English'],
  ['language-masters/en/newsroom', 'Newsroom'],
  ['language-masters/en/newsroom/press-releases', 'Press Releases'],
  ['language-masters/en/newsroom/press-releases/customer-first', 'Customer First'],
];

// ---- helpers ---------------------------------------------------------------
// XML-escape an attribute value.
const attr = (s) => String(s)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

// Final AEM DAM path: strip host and any about-ups-eds segment. The result is
// /content/dam/... (which the manifest's assetDamPath=/content/dam preserves).
const damPath = (src) => (src || '')
  .replace(/^https?:\/\/[^/]*(\/content\/dam\/)/, '$1')
  .replace(/^\/content\/dam\/about-ups-eds\//, '/content/dam/');

const text = (htmlFragment) => new JSDOM(`<div>${htmlFragment || ''}</div>`)
  .window.document.body.textContent.trim();

// Normalize an authored article date to ISO 8601 (YYYY-MM-DD). Source dates are
// MM-DD-YYYY (e.g. "11-02-2021"). Returns '' when the input is missing or not a
// recognizable date, so callers can fall back to the page publish date.
const isoDate = (raw) => {
  const s = (raw || '').trim();
  if (!s) return '';
  const m = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/); // MM-DD-YYYY
  if (m) {
    const [, mm, dd, yyyy] = m;
    return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
  }
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
};

// Category URL = the leaf page's parent path (drop the article slug), kept
// relative with the leading /<locale> root intact and no .html extension.
// e.g. language-masters/en/newsroom/press-releases/customer-first/<slug>
//   -> /language-masters/en/newsroom/press-releases/customer-first
const categoryUrl = (relPath) => `/${relPath.split('/').slice(0, -1).join('/')}`;

// A minimal titled cq:Page node (parent pages). jcr:title lives on jcr:content.
const parentXml = (title) => `<?xml version="1.0" encoding="UTF-8"?>
<jcr:root xmlns:jcr="http://www.jcp.org/jcr/1.0" xmlns:nt="http://www.jcp.org/jcr/nt/1.0" xmlns:cq="http://www.day.com/jcr/cq/1.0" xmlns:sling="http://sling.apache.org/jcr/sling/1.0" jcr:primaryType="cq:Page">
  <jcr:content cq:template="/libs/core/franklin/templates/page" sling:resourceType="core/franklin/components/page/v1/page" jcr:primaryType="cq:PageContent" jcr:title="${attr(title)}"/>
</jcr:root>
`;

// Build one leaf page: parse its .plain.html, write its .content.xml, and
// return { leafRoot, pageTitle, sourceUrl, images } for the manifest/filter.
async function buildLeaf(relPath) {
  const html = await readFile(`content/${relPath}.plain.html`, 'utf8');
  const { document } = new JSDOM(html).window;

  // ---- article-header fields (field:comment cells) ----
  const header = document.querySelector('.article-header');
  const byField = {};
  [...header.querySelectorAll(':scope > div > div')].forEach((cell) => {
    const m = cell.innerHTML.match(/<!--\s*field:(\w+)\s*-->/);
    if (m) byField[m[1]] = cell.innerHTML.replace(/<!--\s*field:\w+\s*-->/, '').trim();
  });

  const eyebrow = text(byField.eyebrow);
  const title = (byField.title || '').trim(); // contains <h1>...</h1>
  const pageTitle = text(title) || 'Article'; // plain-text headline -> jcr:title
  const description = (byField.description || '').trim(); // contains <p>...</p>
  const articleDate = text(byField.articleDate);
  const hideReadTime = text(byField.hideReadTime) || 'false';

  // ---- auto-generated page metadata (rendered to <head> meta tags) ----
  // publishDate: original article date (ISO) if present, else the page publish
  // date at delivery time (today, ISO) as a fallback.
  const publishDate = isoDate(articleDate) || new Date().toISOString().slice(0, 10);
  const categoryTitle = eyebrow; // Category Title = eyebrow text
  const categoryHref = categoryUrl(relPath); // parent path, relative, no .html

  // ---- hero image (first top-level <p><picture><img>) ----
  const heroImgEl = document.querySelector('p img');
  const heroSrcAbs = heroImgEl?.getAttribute('src') || '';
  const heroImg = damPath(heroSrcAbs);
  const heroAlt = heroImgEl?.getAttribute('alt') || '';

  // ---- column control: col1 = body rich text, col2 = social-share ----
  const colBlock = document.querySelector('.column-control');
  const row = colBlock.firstElementChild;
  const [col1El] = [...row.children];
  const bodyHtml = col1El.innerHTML.trim();

  // ---- leaf .content.xml -------------------------------------------------
  const leafXml = `<?xml version="1.0" encoding="UTF-8"?>
<jcr:root xmlns:jcr="http://www.jcp.org/jcr/1.0" xmlns:nt="http://www.jcp.org/jcr/nt/1.0" xmlns:cq="http://www.day.com/jcr/cq/1.0" xmlns:sling="http://sling.apache.org/jcr/sling/1.0" jcr:primaryType="cq:Page">
  <jcr:content cq:template="/libs/core/franklin/templates/page" sling:resourceType="core/franklin/components/page/v1/page" jcr:primaryType="cq:PageContent" jcr:title="${attr(pageTitle)}" jcr:description="${attr(description.replace(/<\/?p>/g, ''))}" publishdate="${attr(publishDate)}" categorytitle="${attr(categoryTitle)}" categoryurl="${attr(categoryHref)}" modelFields="[jcr:title,jcr:description,keywords,publishdate,categorytitle,categoryurl]">
    <root jcr:primaryType="nt:unstructured" sling:resourceType="core/franklin/components/root/v1/root">
      <section sling:resourceType="core/franklin/components/section/v1/section" jcr:primaryType="nt:unstructured" model="section" modelFields="[name,style]">
        <block_breadcrumb sling:resourceType="core/franklin/components/block/v1/block" jcr:primaryType="nt:unstructured" aueComponentId="breadcrumb" homeLabel="Home" model="breadcrumb" modelFields="[homeLabel]" name="Breadcrumb"/>
        <block sling:resourceType="core/franklin/components/block/v1/block" jcr:primaryType="nt:unstructured" aueComponentId="article-header" articleDate="${attr(articleDate)}" description="${attr(description)}" hideReadTime="${attr(hideReadTime)}" model="article-header" modelFields="[eyebrow,eyebrowLink,title,description,articleDate,hideReadTime]" name="Article Header" title="${attr(`<p>${title}</p>`)}"/>
        <image sling:resourceType="core/franklin/components/image/v1/image" jcr:primaryType="nt:unstructured" aueComponentId="image" image="${attr(heroImg)}" imageAlt="${attr(heroAlt)}"/>
        <block_1 sling:resourceType="core/franklin/components/columns/v1/columns" jcr:primaryType="nt:unstructured" aueComponentId="column-control" rows="1" columns="2" model="column-control" modelFields="[columns,classes]" name="Column Control" classes="layout-8-4">
          <row1 jcr:primaryType="nt:unstructured">
            <col1 jcr:primaryType="nt:unstructured">
              <text sling:resourceType="core/franklin/components/text/v1/text" jcr:primaryType="nt:unstructured" aueComponentId="text" text="${attr(bodyHtml)}"/>
            </col1>
            <col2 jcr:primaryType="nt:unstructured">
              <text sling:resourceType="core/franklin/components/text/v1/text" jcr:primaryType="nt:unstructured" aueComponentId="text" text="${attr('<table><thead><tr><th>Social Share</th></tr></thead><tbody><tr><td>Share</td></tr></tbody></table>')}"/>
            </col2>
          </row1>
        </block_1>
      </section>
    </root>
  </jcr:content>
</jcr:root>
`;

  const leafFile = `${CONTENT_BASE}/${relPath}/.content.xml`;
  await mkdir(dirname(leafFile), { recursive: true });
  await writeFile(leafFile, leafXml, 'utf8');
  console.log(`Wrote leaf: ${pageTitle}`);

  const images = [...new Set(
    [...document.querySelectorAll('img')]
      .map((img) => img.getAttribute('src'))
      .filter((s) => s && /\/content\/dam\//.test(s)),
  )];

  return {
    leafRoot: `${CONTENT_PATH}/${relPath}`,
    pageTitle,
    sourceUrl: `https://about.ups.com/${relPath}`,
    images,
  };
}

async function main() {
  // Discover every imported article page (one .plain.html per page).
  const dirEntries = await readdir(`content/${ARTICLES_DIR}`);
  const relPaths = dirEntries
    .filter((f) => f.endsWith('.plain.html'))
    .map((f) => `${ARTICLES_DIR}/${f.replace(/\.plain\.html$/, '')}`)
    .sort();

  if (relPaths.length === 0) throw new Error(`No .plain.html pages found in content/${ARTICLES_DIR}`);

  // ---- write JCR tree (fresh) -------------------------------------------
  await rm(PKG_BASE, { recursive: true, force: true });

  const leaves = await Promise.all(relPaths.map((relPath) => buildLeaf(relPath)));

  await Promise.all(PARENTS.map(async ([rel, ptitle]) => {
    const f = `${CONTENT_BASE}/${rel}/.content.xml`;
    await mkdir(dirname(f), { recursive: true });
    await writeFile(f, parentXml(ptitle), 'utf8');
  }));

  // ---- META-INF: filter.xml + properties.xml -----------------------------
  // Parents: scope the filter to jcr:content so only the title updates and the
  // parent's other child pages are preserved (not deleted by a full replace).
  const parentFilters = PARENTS.map(([rel]) => {
    const p = `${CONTENT_PATH}/${rel}`;
    return `  <filter root="${p}">
    <include pattern="${p}/jcr:content"/>
    <include pattern="${p}/jcr:content/.*"/>
  </filter>`;
  }).join('\n');
  const leafFilters = leaves.map((l) => `  <filter root="${l.leafRoot}"/>`).join('\n');
  const filterXml = `<?xml version="1.0" encoding="UTF-8"?>
<workspaceFilter version="1.0">
${parentFilters}
${leafFilters}
</workspaceFilter>
`;
  await mkdir(META_DIR, { recursive: true });
  await writeFile(join(META_DIR, 'filter.xml'), filterXml, 'utf8');

  const propsXml = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE properties SYSTEM "http://java.sun.com/dtd/properties.dtd">
<properties>
  <entry key="name">${SITE}-article</entry>
  <entry key="group">excat-migration</entry>
  <entry key="version">1.0</entry>
</properties>
`;
  await writeFile(join(META_DIR, 'properties.xml'), propsXml, 'utf8');

  // ---- manifest + asset-mapping ------------------------------------------
  const images = [...new Set(leaves.flatMap((l) => l.images))];
  const manifest = {
    siteName: SITE,
    siteContentPath: CONTENT_PATH,
    assetDamPath: '/content/dam', // NO about-ups-eds — keeps /content/dam/upsstories/...
    baseUrl: 'https://about.ups.com',
    pages: leaves.map((l) => ({ jcrPath: l.leafRoot, sourceUrl: l.sourceUrl })),
    images,
    createdAt: new Date().toISOString(),
  };
  await writeFile(`${PKG_BASE}/${SITE}-manifest.json`, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  await writeFile(`${PKG_BASE}/asset-mapping.json`, '{}\n', 'utf8');

  // ---- zip the jcr tree (jcr_root/ + META-INF/) --------------------------
  const zipPath = `${PKG_BASE}/${SITE}.zip`;
  await new Promise((resolve, reject) => {
    const output = createWriteStream(zipPath);
    const zip = archiver('zip', { zlib: { level: 9 } });
    output.on('close', resolve);
    zip.on('error', reject);
    zip.pipe(output);
    zip.directory(`${PKG_BASE}/jcr/jcr_root`, 'jcr_root');
    zip.directory(`${PKG_BASE}/jcr/META-INF`, 'META-INF');
    zip.finalize();
  });
  console.log(`\nWrote package: ${zipPath}`);
  console.log(`Pages: ${leaves.length} | Images: ${images.length}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
