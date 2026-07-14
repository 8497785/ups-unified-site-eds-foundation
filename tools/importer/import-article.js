/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import articleParser from './parsers/article.js';

// TRANSFORMER IMPORTS
import upsCleanupTransformer from './transformers/ups-cleanup.js';

// PARSER REGISTRY
const parsers = {
  article: articleParser,
};

// PAGE TEMPLATE CONFIGURATION
const PAGE_TEMPLATE = {
  name: 'article',
  description: 'Press-release / article detail page: article-header, hero image, and a Column Control (8/4) with body rich text and a social-share block',
  urls: [
    'https://about.ups.com/us/en/newsroom/press-releases/customer-first/ups-invests--50-million-to-transform-logistics-for-north-america.html',
  ],
  blocks: [
    {
      name: 'article',
      instances: ['div.upspr-two-column'],
    },
  ],
  sections: [],
};

// TRANSFORMER REGISTRY
const transformers = [
  upsCleanupTransformer,
];

function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        pageBlocks.push({ name: blockDef.name, selector, element });
      });
    });
  });
  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;

    // 1. beforeTransform cleanup
    executeTransformers('beforeTransform', main, payload);

    // 2. Find blocks
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse blocks
    pageBlocks.forEach((block) => {
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 4. afterTransform cleanup
    executeTransformers('afterTransform', main, payload);

    // 4b. Isolate the article: keep only the parsed article block, dropping
    // everything outside div.upspr-two-column (Related Stories, dialogs, header/
    // footer remnants) which is out of scope for this template.
    const articleRoot = main.querySelector('[data-article-root="true"]');
    if (articleRoot) {
      while (main.firstChild) main.removeChild(main.firstChild);
      main.appendChild(articleRoot);
    }

    // 5. WebImporter built-in rules. Use the article headline (the parsed H1)
    // as the page title so the imported metadata + JCR jcr:title reflect the
    // real story title rather than a generic placeholder.
    try {
      const h1 = main.querySelector('h1');
      const headline = h1 && h1.textContent.trim();
      if (headline) document.title = headline;
    } catch (e) { /* noop */ }
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 5b. Emit absolute source-site URLs for DAM images so they load in local
    // preview (relative /content/dam/... paths 404 on the dev server). The AEM
    // package step converts these back to relative /content/dam/... on upload.
    main.querySelectorAll('img[src]').forEach((img) => {
      const rewritten = img.getAttribute('src')
        .replace(/^https?:\/\/[^/]*(\/content\/dam\/)/, 'https://about.ups.com$1')
        .replace(/^(\/content\/dam\/)/, 'https://about.ups.com$1');
      img.setAttribute('src', rewritten);
    });

    // 6. Output path: strip the /us/en/ locale prefix and keep the rest. The
    // importer writes relative to its content output root, so the path here must
    // NOT include /content — the /content/language-masters/en JCR root is applied
    // later at the packaging step. Preview lives under /language-masters/en/...
    const srcPath = new URL(params.originalURL).pathname
      .replace(/\.html$/, '')
      .replace(/\/$/, '');
    const rest = srcPath.replace(/^\/us\/en\//, '');
    const path = WebImporter.FileUtils.sanitizePath(`/language-masters/en/${rest}`);

    return [{
      element: main,
      path,
      report: {
        title: 'Article',
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
