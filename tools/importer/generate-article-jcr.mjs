/* eslint-disable no-console */
/**
 * Deterministic JCR generator for the press-release / article page.
 *
 * WHY THIS EXISTS
 * The generic md->JCR converter only builds a real `columns/v1/columns` node
 * when the block header text starts with "columns" (see helix-md2jcr
 * mdast-columns-block.js). Our block is titled "Column Control", so that path
 * collapses the two-column layout. This script builds the article `.content.xml`
 * straight from the imported `.plain.html` using the current component models,
 * so the Column Control node is emitted correctly and repeatably — no
 * hand-authoring of the generated XML.
 *
 * INPUT : content/<path>.plain.html  (bulk-import output)
 * OUTPUT: migration-work/packages/jcr/jcr_root/content/about-ups-eds/<path>/.content.xml
 *
 * Usage: node tools/importer/generate-article-jcr.mjs
 */
import { readFile, writeFile, mkdir } from 'fs/promises';
import { dirname } from 'path';

const SKILL = '/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts/node_modules';
const { JSDOM } = await import(`${SKILL}/jsdom/lib/api.js`);

const REL_PATH = 'language-masters/en/newsroom/press-releases/customer-first/ups-extends-complex-healthcare-logistics-lead-with-48-million-i';
const PLAIN_HTML = `content/${REL_PATH}.plain.html`;
const OUT_XML = `migration-work/packages/jcr/jcr_root/content/about-ups-eds/${REL_PATH}/.content.xml`;

// XML-escape an attribute value.
const attr = (s) => String(s)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

// Rewrite any DAM image URL to the site-relative /content/dam/... path
// (strip the host and any injected about-ups-eds segment).
const relImage = (src) => (src || '')
  .replace(/^https?:\/\/[^/]*(\/content\/dam\/)/, '$1')
  .replace(/^\/content\/dam\/about-ups-eds\//, '/content/dam/');

// Serialize an element's inner HTML into the string a franklin rich-text /
// title field stores (used verbatim inside a JCR attribute).
function innerHtml(el) {
  return el ? el.innerHTML.trim() : '';
}

async function main() {
  const html = await readFile(PLAIN_HTML, 'utf8');
  const { document } = new JSDOM(html).window;

  // ---- article-header fields (field:comment cells) ----
  const header = document.querySelector('.article-header');

  // Read each header field cell by its field comment.
  const cells = [...header.querySelectorAll(':scope > div > div')];
  const byField = {};
  cells.forEach((cell) => {
    const m = cell.innerHTML.match(/<!--\s*field:(\w+)\s*-->/);
    if (m) {
      byField[m[1]] = cell.innerHTML.replace(/<!--\s*field:\w+\s*-->/, '').trim();
    }
  });

  const eyebrow = (new JSDOM(`<div>${byField.eyebrow || ''}</div>`)).window.document.body.textContent.trim();
  const eyebrowLinkEl = (new JSDOM(`<div>${byField.eyebrowLink || ''}</div>`)).window.document.querySelector('a');
  const eyebrowLink = eyebrowLinkEl ? eyebrowLinkEl.getAttribute('href') : '';
  const title = (byField.title || '').trim(); // contains <h1>...</h1>
  const description = (byField.description || '').trim(); // contains <p>...</p>
  const articleDate = (new JSDOM(`<div>${byField.articleDate || ''}</div>`)).window.document.body.textContent.trim();
  const hideReadTime = (new JSDOM(`<div>${byField.hideReadTime || ''}</div>`)).window.document.body.textContent.trim() || 'false';

  // ---- hero image (first top-level <p><picture><img>) ----
  const heroImgEl = document.querySelector('main img, body > p img, p img');
  const heroImg = relImage(heroImgEl?.getAttribute('src'));
  const heroAlt = heroImgEl?.getAttribute('alt') || '';

  // ---- column control: col1 = body rich text, col2 = social-share ----
  const colBlock = document.querySelector('.column-control');
  const row = colBlock.firstElementChild;
  const [col1El] = [...row.children];
  // col1 body: the left column's rich text (social-share lives in col2).
  const bodyHtml = innerHtml(col1El.cloneNode(true));

  // Build XML.
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<jcr:root xmlns:jcr="http://www.jcp.org/jcr/1.0" xmlns:nt="http://www.jcp.org/jcr/nt/1.0" xmlns:cq="http://www.day.com/jcr/cq/1.0" xmlns:sling="http://sling.apache.org/jcr/sling/1.0" jcr:primaryType="cq:Page">
  <jcr:content cq:template="/libs/core/franklin/templates/page" sling:resourceType="core/franklin/components/page/v1/page" jcr:primaryType="cq:PageContent" jcr:title="Article" jcr:description="${attr(description.replace(/<\/?p>/g, ''))}" modelFields="[jcr:title,jcr:description,keywords]">
    <root jcr:primaryType="nt:unstructured" sling:resourceType="core/franklin/components/root/v1/root">
      <section sling:resourceType="core/franklin/components/section/v1/section" jcr:primaryType="nt:unstructured" model="section" modelFields="[name,style]">
        <block sling:resourceType="core/franklin/components/block/v1/block" jcr:primaryType="nt:unstructured" articleDate="${attr(articleDate)}" description="${attr(description)}" eyebrow="${attr(eyebrow)}" eyebrowLink="${attr(eyebrowLink)}" hideReadTime="${attr(hideReadTime)}" model="article-header" modelFields="[eyebrow,eyebrowLink,title,description,articleDate,hideReadTime]" name="Article Header" title="${attr(`<p>${title}</p>`)}"/>
        <image sling:resourceType="core/franklin/components/image/v1/image" jcr:primaryType="nt:unstructured" image="${attr(heroImg)}" imageAlt="${attr(heroAlt)}"/>
        <block_1 sling:resourceType="core/franklin/components/columns/v1/columns" jcr:primaryType="nt:unstructured" rows="1" columns="2" model="column-control" modelFields="[classes]" name="Column Control" classes="layout-8-4">
          <row1 jcr:primaryType="nt:unstructured">
            <col1 jcr:primaryType="nt:unstructured">
              <text sling:resourceType="core/franklin/components/text/v1/text" jcr:primaryType="nt:unstructured" text="${attr(bodyHtml)}"/>
            </col1>
            <col2 jcr:primaryType="nt:unstructured">
              <block sling:resourceType="core/franklin/components/block/v1/block" jcr:primaryType="nt:unstructured" model="social-share" modelFields="[label]" name="Social Share"/>
            </col2>
          </row1>
        </block_1>
      </section>
    </root>
  </jcr:content>
</jcr:root>
`;

  await mkdir(dirname(OUT_XML), { recursive: true });
  await writeFile(OUT_XML, xml, 'utf8');
  console.log(`Wrote ${OUT_XML}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
