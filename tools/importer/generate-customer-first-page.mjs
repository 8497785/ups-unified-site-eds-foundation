/* eslint-disable no-console */
/**
 * Deterministic generator for the Customer First CATEGORY page.
 *
 * The customer-first node existed only as a bare structural page (jcr:content
 * with a jcr:title but no root/section), so the editor could not add
 * sections/blocks and the client scripts threw before the header/footer could
 * decorate (no <main>/section present). This rewrites just that one page node
 * as a proper Franklin page with an empty, authorable section:
 *   jcr:content > root > section
 *
 * The filter is scoped to jcr:content only, so installing the package updates
 * the page itself WITHOUT deleting its child pages (the migrated articles live
 * under customer-first/<slug>).
 *
 * OUTPUT: a standalone content package (zip) scoped to just this page:
 *   migration-work/packages-customer-first/customer-first.zip
 *
 * Usage: node tools/importer/generate-customer-first-page.mjs
 */
import {
  writeFile, mkdir, rm,
} from 'fs/promises';
import { createWriteStream } from 'fs';
import { join } from 'path';

const SKILL = '/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts/node_modules';
const archiver = (await import(`${SKILL}/archiver/index.js`)).default;

const SITE = 'about-ups-eds';
const REL_PATH = 'language-masters/en/newsroom/press-releases/customer-first';
const CONTENT_PATH = `/content/${SITE}/${REL_PATH}`;

const PKG_BASE = 'migration-work/packages-customer-first';
const JCR_ROOT = `${PKG_BASE}/jcr/jcr_root`;
const CONTENT_BASE = `${JCR_ROOT}/content/${SITE}`;
const META_DIR = `${PKG_BASE}/jcr/META-INF/vault`;

const attr = (s) => String(s)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const PAGE_TITLE = 'Customer First';

async function main() {
  // Customer First .content.xml: a real Franklin page with an empty section
  // so authors can add blocks and the header/footer decorate correctly.
  const leafXml = `<?xml version="1.0" encoding="UTF-8"?>
<jcr:root xmlns:jcr="http://www.jcp.org/jcr/1.0" xmlns:nt="http://www.jcp.org/jcr/nt/1.0" xmlns:cq="http://www.day.com/jcr/cq/1.0" xmlns:sling="http://sling.apache.org/jcr/sling/1.0" jcr:primaryType="cq:Page">
  <jcr:content cq:template="/libs/core/franklin/templates/page" sling:resourceType="core/franklin/components/page/v1/page" jcr:primaryType="cq:PageContent" jcr:title="${attr(PAGE_TITLE)}" modelFields="[jcr:title,jcr:description,keywords]">
    <root jcr:primaryType="nt:unstructured" sling:resourceType="core/franklin/components/root/v1/root">
      <section sling:resourceType="core/franklin/components/section/v1/section" jcr:primaryType="nt:unstructured" model="section" modelFields="[name,style]"/>
    </root>
  </jcr:content>
</jcr:root>
`;

  await rm(PKG_BASE, { recursive: true, force: true });

  const leafFile = `${CONTENT_BASE}/${REL_PATH}/.content.xml`;
  await mkdir(join(CONTENT_BASE, REL_PATH), { recursive: true });
  await writeFile(leafFile, leafXml, 'utf8');
  console.log(`Wrote page: ${leafFile}`);

  // Filter scoped to jcr:content ONLY, so the page's child pages (the migrated
  // articles under customer-first/<slug>) are preserved on install.
  const filterXml = `<?xml version="1.0" encoding="UTF-8"?>
<workspaceFilter version="1.0">
  <filter root="${CONTENT_PATH}">
    <include pattern="${CONTENT_PATH}/jcr:content"/>
    <include pattern="${CONTENT_PATH}/jcr:content/.*"/>
  </filter>
</workspaceFilter>
`;
  await mkdir(META_DIR, { recursive: true });
  await writeFile(join(META_DIR, 'filter.xml'), filterXml, 'utf8');

  const propsXml = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE properties SYSTEM "http://java.sun.com/dtd/properties.dtd">
<properties>
  <entry key="name">customer-first</entry>
  <entry key="group">excat-migration</entry>
  <entry key="version">1.0</entry>
</properties>
`;
  await writeFile(join(META_DIR, 'properties.xml'), propsXml, 'utf8');

  const zipPath = `${PKG_BASE}/customer-first.zip`;
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
