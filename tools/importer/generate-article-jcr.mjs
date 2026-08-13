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

// Selected-pages mode: `node generate-article-jcr.mjs <slug> [<slug> ...]`
// builds a package for exactly those leaves (filter scoped to each page only —
// no parents, no other siblings), so installing it can never touch any other
// page. The special first arg `--rest` selects every imported page EXCEPT the
// one already delivered (interglobe). Without args, all pages are built
// (parents included) as before.
//
// `--category=<name>` selects which press-releases sub-folder to package
// (default: customer-first). e.g. --category=financials.
const RAW_ARGS = process.argv.slice(2);
const CATEGORY = (RAW_ARGS.find((a) => a.startsWith('--category=')) || '').split('=')[1]
  || 'customer-first';
// `--dir=<relpath>` overrides the folder scanned for imported *.plain.html
// (relative to content/), for article-structured pages that live outside the
// press-releases/<category> tree (e.g. language-masters/en/newsroom for the
// Facebook Rules page). Defaults to the press-releases/<category> folder.
const DIR_OVERRIDE = (RAW_ARGS.find((a) => a.startsWith('--dir=')) || '').split('=')[1] || '';
// `--name=<pkgname>` overrides the output package (zip + properties) name,
// useful for a combined multi-folder build (e.g. --name=newsroom-statements).
const NAME_OVERRIDE = (RAW_ARGS.find((a) => a.startsWith('--name=')) || '').split('=')[1] || '';
const ARGS = RAW_ARGS.filter((a) => !a.startsWith('--category=') && !a.startsWith('--dir=') && !a.startsWith('--name='));
const REST_MODE = ARGS[0] === '--rest';
const ALL_MODE = ARGS[0] === '--all'; // every page, leaves-only, no parents
const ONLY_SLUGS = (REST_MODE || ALL_MODE) ? [] : ARGS;
const SINGLE = REST_MODE || ALL_MODE || ONLY_SLUGS.length > 0;
const ALREADY_DELIVERED = ['interglobe-enterprises-and-ups-launch-movin'];

// All article pages live under this folder. The generator discovers every
// imported *.plain.html here and packages each as its own leaf page, so one
// zip can carry any number of pages (re-running is idempotent per page).
// One or more folders (comma-separated in --dir=) scanned for imported pages.
const ARTICLES_DIRS = (DIR_OVERRIDE
  || `language-masters/en/newsroom/press-releases/${CATEGORY}`)
  .split(',').map((d) => d.trim()).filter(Boolean);

const PKG_BASE = SINGLE ? 'migration-work/packages-single' : 'migration-work/packages';
const JCR_ROOT = `${PKG_BASE}/jcr/jcr_root`;
const CONTENT_BASE = `${JCR_ROOT}/content/${SITE}`;
const META_DIR = `${PKG_BASE}/jcr/META-INF/vault`;
const CONTENT_PATH = `/content/${SITE}`; // AEM path prefix

// Load a per-category JSON map, falling back to {} if the file doesn't exist.
async function loadMap(name) {
  try {
    return JSON.parse(await readFile(new URL(`./${name}`, import.meta.url), 'utf8'));
  } catch (e) {
    return {};
  }
}

// Related Stories map: { <leaf-slug>: [<related-slug>, ...] }, populated from
// the live source site (visible Related Stories cards). A page listed here with
// >=1 slug gets Section 3; absent/empty -> no Related Stories section.
// Per-category (related-stories-<category>.json), falling back to the legacy
// customer-first file (related-stories.json).
const RELATED = {
  ...(CATEGORY === 'customer-first' ? await loadMap('related-stories.json') : {}),
  ...await loadMap(`related-stories-${CATEGORY}.json`),
};

// Keywords map: { <leaf-slug>: ["kw", ...] } from each source page's
// <meta name="keywords">. Per-category (keywords-<category>.json), falling back
// to the legacy customer-first file (keywords.json).
const KEYWORDS = {
  ...(CATEGORY === 'customer-first' ? await loadMap('keywords.json') : {}),
  ...await loadMap(`keywords-${CATEGORY}.json`),
};

// Authoring-locale content path for a category article slug (language-masters/
// en), used for the static related-articles paths and category. MSM rewrites
// language-masters/en -> us/en on rollout.
const CF_CATEGORY = `/content/${SITE}/language-masters/en/newsroom/press-releases/${CATEGORY}`;
const relatedContentPath = (slug) => `${CF_CATEGORY}/${slug}`;

// Intermediate parent pages -> jcr:title. language-masters / en are structural.
// NOTE: the press-releases listing page is intentionally EXCLUDED — it is
// authored/maintained directly in AEM (Breadcrumb + Headline + Content List),
// so the generator must never write its .content.xml or a filter that covers
// it, otherwise installing the package would overwrite those author edits.
const PARENTS = [
  ['language-masters', 'Language Masters'],
  ['language-masters/en', 'English'],
  ['language-masters/en/newsroom', 'Newsroom'],
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

// Category URL = the leaf page's parent path (drop the article slug), kept
// relative with the leading /<locale> root intact and no .html extension.
// e.g. language-masters/en/newsroom/press-releases/customer-first/<slug>
//   -> /language-masters/en/newsroom/press-releases/customer-first
const categoryUrl = (relPath) => `/${relPath.split('/').slice(0, -1).join('/')}`;

// Category as a full AEM content reference (for the authorable eyebrowLink,
// an aem-content field). This is the real JCR path of the parent category page,
// which MSM rewrites (language-masters/en -> us/en) on rollout.
// e.g. -> /content/about-ups-eds/language-masters/en/newsroom/press-releases/customer-first
const categoryContentPath = (relPath) => `/content/${SITE}${categoryUrl(relPath)}`;

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
  const description = (byField.description || '').trim(); // contains <p>...</p> (on-page subtext)
  const articleDate = text(byField.articleDate);
  const hideReadTime = text(byField.hideReadTime) || 'false';

  // ---- SEO description (jcr:description) ----
  // The on-page subtext (article-header description) is often empty; the page's
  // meta description lives in the importer's .metadata block (Description row).
  // Prefer the subtext when present, else fall back to the metadata block so the
  // jcr:description / og:description is populated from the source page.
  const metaRows = [...document.querySelectorAll('.metadata > div')];
  const metaDescRow = metaRows.find((r) => (r.firstElementChild?.textContent || '').trim().toLowerCase() === 'description');
  const metaDescription = metaDescRow ? (metaDescRow.children[1]?.textContent || '').trim() : '';
  const seoDescription = text(description) || metaDescription;

  // Category link for the article-header eyebrow (authorable aem-content ref).
  // Category title/URL and publish date are NOT written as page metadata — the
  // query index reads category/published from the article-header block cells,
  // and the featured image lives in the image node below.
  const eyebrowLink = categoryContentPath(relPath);

  // ---- hero image (first top-level <p><picture><img>) ----
  const heroImgEl = document.querySelector('p img');
  const heroSrcAbs = heroImgEl?.getAttribute('src') || '';
  const heroImg = damPath(heroSrcAbs);
  const heroAlt = heroImgEl?.getAttribute('alt') || '';

  // ---- article body rich text ----
  // The imported .plain.html carries the body in a .column-control > row > col1
  // cell (col2 was the social-share carrier). Read that first column as the body;
  // it now becomes the `column_section` text node in the JCR (social share is its
  // own sibling column section).
  const colBlock = document.querySelector('.column-control');
  const row = colBlock.firstElementChild;
  const [col1El] = [...row.children];
  // Relativize any DAM image src inside the body rich text: strip the host and
  // any about-ups-eds segment so it becomes /content/dam/... (absolute
  // about.ups.com paths don't load in preview). Mirrors damPath() for the hero.
  col1El.querySelectorAll('img[src]').forEach((img) => {
    img.setAttribute('src', damPath(img.getAttribute('src')));
  });
  const bodyHtml = col1El.innerHTML.trim();

  // ---- related stories (Section 3) ----
  // Derived from the live source site (see related-stories.json). Present only
  // when the source page has a visible Related Stories section. Static mode:
  // the extracted card destinations become path1..3 (delivery-locale us/en).
  const leafSlug = relPath.split('/').pop();

  // ---- keywords (page-metadata string[]) ----
  // From the source page's <meta name="keywords"> (see keywords.json). JCR
  // multi-value string arrays are written as [a,b,c]; commas inside a single
  // value are escaped as \, so they aren't read as separators.
  const keywords = KEYWORDS[leafSlug] || [];
  const keywordsAttr = keywords.length
    ? ` keywords="[${keywords.map((k) => attr(k).replace(/,/g, '\\,')).join(',')}]"`
    : '';

  const relatedSlugs = (RELATED[leafSlug] || []).slice(0, 3);
  const relatedPathAttrs = relatedSlugs
    .map((slug, i) => `path${i + 1}="${attr(relatedContentPath(slug))}"`)
    .join(' ');

  const relatedSectionXml = relatedSlugs.length ? `
      <section_related sling:resourceType="core/franklin/components/section/v1/section" jcr:primaryType="nt:unstructured" model="section" modelFields="[name,style]" style="[highlight]">
        <title_block sling:resourceType="core/franklin/components/block/v1/block" jcr:primaryType="nt:unstructured" aueComponentId="title-block" model="title-block" modelFields="[title,titleType,alignment,showEyebrow]" name="Title" title="Related Stories" titleType="h2" alignment="align-center" showEyebrow="true"/>
        <related_articles sling:resourceType="core/franklin/components/block/v1/block" jcr:primaryType="nt:unstructured" aueComponentId="related-articles" model="related-articles" modelFields="[mode,category,articleCount,path1,path2,path3,showDate]" name="Related Articles" mode="static" category="" articleCount="3" ${relatedPathAttrs}/>
      </section_related>` : '';

  // ---- leaf .content.xml -------------------------------------------------
  // Sibling sections per the target structure:
  //   section_breadcrumb (no-top-spacing)  -> Breadcrumb
  //   section (article)                    -> Article Header, hero Image
  //   column_section (width-70)            -> body rich text
  //   column_section_1 (remaining)         -> Social Share block
  //   section_related (highlight)          -> Title + Related Articles (if any)
  //
  // The two column_section sections are real top-level sections (not a columns
  // block). scripts.js addColumnSectionsWrapper() groups adjacent `.section.column`
  // into a flex wrapper on both author and delivery — so the social-share block
  // is an ordinary top-level section block that md2jcr delivers natively (no
  // table-carrier hack needed, and it can't flatten the way a nested block node
  // did inside column-control).
  const columnFields = 'modelFields="[style_width@select,style_background@select,style_sectiontype@text]"';
  const leafXml = `<?xml version="1.0" encoding="UTF-8"?>
<jcr:root xmlns:jcr="http://www.jcp.org/jcr/1.0" xmlns:nt="http://www.jcp.org/jcr/nt/1.0" xmlns:cq="http://www.day.com/jcr/cq/1.0" xmlns:sling="http://sling.apache.org/jcr/sling/1.0" jcr:primaryType="cq:Page">
  <jcr:content cq:template="/libs/core/franklin/templates/page" sling:resourceType="core/franklin/components/page/v1/page" jcr:primaryType="cq:PageContent" jcr:title="${attr(pageTitle)}" jcr:description="${attr(seoDescription.replace(/<\/?p>/g, ''))}"${keywordsAttr} modelFields="[jcr:title,jcr:description,keywords]">
    <image jcr:primaryType="nt:unstructured" fileReference="${attr(heroImg)}"/>
    <root jcr:primaryType="nt:unstructured" sling:resourceType="core/franklin/components/root/v1/root">
      <section_breadcrumb sling:resourceType="core/franklin/components/section/v1/section" jcr:primaryType="nt:unstructured" model="section" modelFields="[name,style]" style="[no-top-spacing]">
        <block_breadcrumb sling:resourceType="core/franklin/components/block/v1/block" jcr:primaryType="nt:unstructured" aueComponentId="breadcrumb" homeLabel="Home" model="breadcrumb" modelFields="[homeLabel]" name="Breadcrumb"/>
      </section_breadcrumb>
      <section sling:resourceType="core/franklin/components/section/v1/section" jcr:primaryType="nt:unstructured" model="section" modelFields="[name,style]">
        <block sling:resourceType="core/franklin/components/block/v1/block" jcr:primaryType="nt:unstructured" aueComponentId="article-header" articleDate="${attr(articleDate)}" description="${attr(description)}" eyebrow="${attr(eyebrow)}" eyebrowLink="${attr(eyebrowLink)}" hideReadTime="${attr(hideReadTime)}" model="article-header" modelFields="[eyebrow,eyebrowLink,title,description,articleDate,hideReadTime]" name="Article Header" title="${attr(`<p>${title}</p>`)}"/>
        <image sling:resourceType="core/franklin/components/image/v1/image" jcr:primaryType="nt:unstructured" aueComponentId="image" image="${attr(heroImg)}" imageAlt="${attr(heroAlt)}"/>
      </section>
      <column_section sling:resourceType="core/franklin/components/section/v1/section" jcr:primaryType="nt:unstructured" aueComponentId="column-section" model="column-section" filter="column-section" name="Column" ${columnFields} style_sectiontype="column" style_width="width-60">
        <text sling:resourceType="core/franklin/components/text/v1/text" jcr:primaryType="nt:unstructured" aueComponentId="text" text="${attr(bodyHtml)}"/>
      </column_section>
      <column_section_1 sling:resourceType="core/franklin/components/section/v1/section" jcr:primaryType="nt:unstructured" aueComponentId="column-section" model="column-section" filter="column-section" name="Column" ${columnFields} style_sectiontype="column" style_width="width-100">
        <social_share sling:resourceType="core/franklin/components/block/v1/block" jcr:primaryType="nt:unstructured" aueComponentId="social-share" model="social-share" modelFields="[label@text]" name="Social Share"/>
      </column_section_1>${relatedSectionXml}
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
  // Discover every imported article page (one .plain.html per page) across all
  // requested folders.
  const perDir = await Promise.all(ARTICLES_DIRS.map(async (dir) => {
    const dirEntries = await readdir(`content/${dir}`);
    return dirEntries
      .filter((f) => f.endsWith('.plain.html'))
      .map((f) => `${dir}/${f.replace(/\.plain\.html$/, '')}`);
  }));
  let relPaths = perDir.flat().sort();

  // Selected-pages mode: keep only the requested slugs, or (with --rest) every
  // page except the ones already delivered.
  if (REST_MODE) {
    relPaths = relPaths.filter((p) => !ALREADY_DELIVERED.includes(p.split('/').pop()));
  } else if (ONLY_SLUGS.length) {
    relPaths = relPaths.filter((p) => ONLY_SLUGS.includes(p.split('/').pop()));
    if (relPaths.length === 0) {
      throw new Error(`Selected-pages mode: no imported page matches ${JSON.stringify(ONLY_SLUGS)}`);
    }
  }

  if (relPaths.length === 0) throw new Error(`No .plain.html pages found in content/{${ARTICLES_DIRS.join(',')}}`);

  // ---- write JCR tree (fresh) -------------------------------------------
  await rm(PKG_BASE, { recursive: true, force: true });

  const leaves = await Promise.all(relPaths.map((relPath) => buildLeaf(relPath)));

  // Parents are written/filtered only in full mode. In single-page mode the
  // package must contain ONLY the one leaf — no parent nodes, no other pages.
  if (!SINGLE) {
    await Promise.all(PARENTS.map(async ([rel, ptitle]) => {
      const f = `${CONTENT_BASE}/${rel}/.content.xml`;
      await mkdir(dirname(f), { recursive: true });
      await writeFile(f, parentXml(ptitle), 'utf8');
    }));
  }

  // ---- META-INF: filter.xml + properties.xml -----------------------------
  // Parents: scope the filter to jcr:content so only the title updates and the
  // parent's other child pages are preserved (not deleted by a full replace).
  const parentFilters = SINGLE ? '' : PARENTS.map(([rel]) => {
    const p = `${CONTENT_PATH}/${rel}`;
    return `  <filter root="${p}">
    <include pattern="${p}/jcr:content"/>
    <include pattern="${p}/jcr:content/.*"/>
  </filter>`;
  }).join('\n');
  const leafFilters = leaves.map((l) => `  <filter root="${l.leafRoot}"/>`).join('\n');
  const filterXml = `<?xml version="1.0" encoding="UTF-8"?>
<workspaceFilter version="1.0">
${[parentFilters, leafFilters].filter(Boolean).join('\n')}
</workspaceFilter>
`;
  await mkdir(META_DIR, { recursive: true });
  await writeFile(join(META_DIR, 'filter.xml'), filterXml, 'utf8');

  let pkgName = `${SITE}-article`;
  if (NAME_OVERRIDE) pkgName = NAME_OVERRIDE;
  else if (ALL_MODE) pkgName = `${CATEGORY}-all`;
  else if (REST_MODE) pkgName = `${CATEGORY}-remaining`;
  else if (ONLY_SLUGS.length === 1) [pkgName] = ONLY_SLUGS;
  else if (ONLY_SLUGS.length > 1) pkgName = 'customer-first-selected';
  const propsXml = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE properties SYSTEM "http://java.sun.com/dtd/properties.dtd">
<properties>
  <entry key="name">${pkgName}</entry>
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
  const zipPath = `${PKG_BASE}/${pkgName}.zip`;
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
