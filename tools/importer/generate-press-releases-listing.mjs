/* eslint-disable no-console */
/**
 * Deterministic generator for the Press Releases LISTING page.
 *
 * The listing page node existed only as a bare structural page (jcr:content with
 * a jcr:title but no root/section), so it rendered nothing and the client scripts
 * threw (no <main>/section to decorate). This builds a proper Franklin page:
 *   jcr:content > root > section > [ breadcrumb, headline, content-list ]
 * Each block carries aueComponentId so it decorates/renders on delivery.
 *
 * OUTPUT: a standalone content package (zip) scoped to just the listing page:
 *   migration-work/packages-listing/press-releases.zip
 *
 * Usage: node tools/importer/generate-press-releases-listing.mjs
 */
import {
  writeFile, mkdir, rm,
} from 'fs/promises';
import { createWriteStream } from 'fs';
import { join } from 'path';

const SKILL = '/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts/node_modules';
const archiver = (await import(`${SKILL}/archiver/index.js`)).default;

const SITE = 'about-ups-eds';
const REL_PATH = 'language-masters/en/newsroom/press-releases';
const CONTENT_PATH = `/content/${SITE}/${REL_PATH}`;

const PKG_BASE = 'migration-work/packages-listing';
const JCR_ROOT = `${PKG_BASE}/jcr/jcr_root`;
const CONTENT_BASE = `${JCR_ROOT}/content/${SITE}`;
const META_DIR = `${PKG_BASE}/jcr/META-INF/vault`;

const attr = (s) => String(s)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const PAGE_TITLE = 'Press Releases';
// Category-driven: list every article under the press-releases root from the
// shared locale query index (/us/en/query-index.json).
const CATEGORY_PATH = '/content/about-ups-eds/us/en/newsroom/press-releases';

async function main() {
  // Listing page .content.xml: a real Franklin page with a section holding
  // breadcrumb, headline, and the content-list block.
  const leafXml = `<?xml version="1.0" encoding="UTF-8"?>
<jcr:root xmlns:jcr="http://www.jcp.org/jcr/1.0" xmlns:nt="http://www.jcp.org/jcr/nt/1.0" xmlns:cq="http://www.day.com/jcr/cq/1.0" xmlns:sling="http://sling.apache.org/jcr/sling/1.0" jcr:primaryType="cq:Page">
  <jcr:content cq:template="/libs/core/franklin/templates/page" sling:resourceType="core/franklin/components/page/v1/page" jcr:primaryType="cq:PageContent" jcr:title="${attr(PAGE_TITLE)}" modelFields="[jcr:title,jcr:description,keywords]">
    <root jcr:primaryType="nt:unstructured" sling:resourceType="core/franklin/components/root/v1/root">
      <section sling:resourceType="core/franklin/components/section/v1/section" jcr:primaryType="nt:unstructured" model="section" modelFields="[name,style]">
        <block sling:resourceType="core/franklin/components/block/v1/block" jcr:primaryType="nt:unstructured" aueComponentId="breadcrumb" homeLabel="Home" model="breadcrumb" modelFields="[homeLabel]" name="Breadcrumb"/>
        <block_1 sling:resourceType="core/franklin/components/block/v1/block" jcr:primaryType="nt:unstructured" aueComponentId="headline" model="headline" modelFields="[title]" name="Headline" title="${attr(`<h1>${PAGE_TITLE}</h1>`)}"/>
        <block_2 sling:resourceType="core/franklin/components/block/v1/block" jcr:primaryType="nt:unstructured" aueComponentId="content-list" category="${attr(CATEGORY_PATH)}" loadMoreLabel="Load more" model="content-list" modelFields="[category,pageSize,loadMoreLabel,showDate]" name="Content List" pageSize="12"/>
      </section>
    </root>
  </jcr:content>
</jcr:root>
`;

  await rm(PKG_BASE, { recursive: true, force: true });

  const leafFile = `${CONTENT_BASE}/${REL_PATH}/.content.xml`;
  await mkdir(join(CONTENT_BASE, REL_PATH), { recursive: true });
  await writeFile(leafFile, leafXml, 'utf8');
  console.log(`Wrote listing page: ${leafFile}`);

  // filter scoped to the single listing page path.
  const filterXml = `<?xml version="1.0" encoding="UTF-8"?>
<workspaceFilter version="1.0">
  <filter root="${CONTENT_PATH}"/>
</workspaceFilter>
`;
  await mkdir(META_DIR, { recursive: true });
  await writeFile(join(META_DIR, 'filter.xml'), filterXml, 'utf8');

  const propsXml = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE properties SYSTEM "http://java.sun.com/dtd/properties.dtd">
<properties>
  <entry key="name">press-releases</entry>
  <entry key="group">excat-migration</entry>
  <entry key="version">1.0</entry>
</properties>
`;
  await writeFile(join(META_DIR, 'properties.xml'), propsXml, 'utf8');

  const zipPath = `${PKG_BASE}/press-releases.zip`;
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
  console.log(`Wrote package: ${zipPath}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
