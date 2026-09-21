/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroFeaturedParser from './parsers/hero-featured.js';
import cardsStoryParser from './parsers/cards-story.js';
import heroStatsParser from './parsers/hero-stats.js';
import columnsMediaParser from './parsers/columns-media.js';

// TRANSFORMER IMPORTS
import upsCleanupTransformer from './transformers/ups-cleanup.js';
import upsSectionsTransformer from './transformers/ups-sections.js';

// PARSER REGISTRY
const parsers = {
  'hero-featured': heroFeaturedParser,
  'cards-story': cardsStoryParser,
  'hero-stats': heroStatsParser,
  'columns-media': columnsMediaParser,
};

// PAGE TEMPLATE CONFIGURATION
const PAGE_TEMPLATE = {
  name: 'homepage',
  description: 'Main landing page with hero story, story cards grid, about us band, stats section, and impact media card',
  urls: [
    'https://about.ups.com/us/en/home.html',
  ],
  blocks: [
    {
      name: 'hero-featured',
      instances: ['div.upspr-heroimage:not(.vertical-hero)'],
    },
    {
      name: 'cards-story',
      instances: ['div.upspr-three-column-teaser'],
    },
    {
      name: 'hero-stats',
      instances: ['div.upspr-heroimage.vertical-hero'],
    },
    {
      name: 'columns-media',
      instances: ['div.upspr-xd-card.left'],
    },
  ],
  sections: [
    {
      id: 'section-1-tagline',
      name: 'Tagline',
      selector: 'div.headline:has(h1)',
      style: null,
      blocks: [],
      defaultContent: ['div.upspr-headline h1'],
    },
    {
      id: 'section-2-featured-story-hero',
      name: 'Featured Story Hero',
      selector: 'div.hero:has(.upspr-heroimage:not(.vertical-hero))',
      style: null,
      blocks: ['hero-featured'],
      defaultContent: [],
    },
    {
      id: 'section-3-story-cards',
      name: 'Story Cards',
      selector: 'div.pr04-threecolumnteaser',
      style: null,
      blocks: ['cards-story'],
      defaultContent: ["a.btn.btn-secondary[href*='all-stories']"],
    },
    {
      id: 'section-4-about-us',
      name: 'About Us Text Band',
      selector: 'div.headline:has(h4:first-child)',
      style: null,
      blocks: [],
      defaultContent: ['div.upspr-headline h4', 'div.upspr-headline h2', 'div.headline-cta a.btn'],
    },
    {
      id: 'section-5-stats',
      name: 'Stats / Facts',
      selector: 'div.hero:has(.upspr-heroimage.vertical-hero)',
      style: null,
      blocks: ['hero-stats'],
      defaultContent: [],
    },
    {
      id: 'section-6-impact',
      name: 'Impact Media Card',
      selector: 'div.sectioncard',
      style: null,
      blocks: ['columns-media'],
      defaultContent: [],
    },
  ],
};

// TRANSFORMER REGISTRY
const transformers = [
  upsCleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [upsSectionsTransformer] : []),
];

/**
 * Execute all page transformers for a specific hook
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = {
    ...payload,
    template: PAGE_TEMPLATE,
  };

  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all blocks on the page based on the embedded template configuration
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];

  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        pageBlocks.push({
          name: blockDef.name,
          selector,
          element,
          section: blockDef.section || null,
        });
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

    // 1. Execute beforeTransform transformers (initial cleanup)
    executeTransformers('beforeTransform', main, payload);

    // 2. Find blocks on page using embedded template
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block using registered parsers
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

    // 4. Execute afterTransform transformers (final cleanup + section breaks)
    executeTransformers('afterTransform', main, payload);

    // 5. Apply WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Generate sanitized path
    const path = WebImporter.FileUtils.sanitizePath(
      new URL(params.originalURL).pathname.replace(/\/$/, '').replace(/\.html$/, ''),
    );

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
