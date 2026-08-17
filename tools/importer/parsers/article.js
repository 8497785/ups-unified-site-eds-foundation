/* eslint-disable */
/* global WebImporter */

/**
 * Parser: article  →  emits DECOMPOSED blocks
 * Source: https://about.ups.com/us/en/newsroom/press-releases/customer-first/...
 * Selector: div.upspr-two-column
 *
 * Produces, in order, within a single container:
 *   1. article-header block (eyebrow, eyebrowLink, title, description, articleDate, hideReadTime)
 *   2. hero image (default content <picture>)
 *   3. Column Control (8/4):
 *        left  (width 8) = body rich text
 *        right (width 4) = social-share block
 *
 * "Related Stories" lives outside div.upspr-two-column and is excluded.
 *
 * Validated selectors against source HTML:
 *   .upspr-two-column_eyebrow a.upspr-eyebrow-link -> eyebrow link ("Customer First")
 *   .upspr-eyebrow-text                            -> eyebrow label text
 *   .upspr-two-column_title h1                     -> article title
 *   .upspr-byline .upspr-story-date                -> article date ("06-22-2026")
 *   .upspr-two-column_subtext                      -> description
 *   .upspr-heroimage img                           -> hero image (src attribute)
 *   .cmp-text                                      -> body rich text paragraphs
 */
export default function parse(element, { document }) {
  const cellComment = (name) => document.createComment(` field:${name} `);

  // ---- article-header block ----
  const eyebrowLink = element.querySelector('.upspr-two-column_eyebrow a.upspr-eyebrow-link, .upspr-two-column_eyebrow a');
  const eyebrowTextEl = element.querySelector('.upspr-two-column_eyebrow .upspr-eyebrow-text');
  const eyebrowText = eyebrowTextEl
    ? eyebrowTextEl.textContent.trim()
    : (eyebrowLink ? eyebrowLink.textContent.trim() : '');

  const eyebrowCell = document.createDocumentFragment();
  eyebrowCell.appendChild(cellComment('eyebrow'));
  if (eyebrowText) eyebrowCell.appendChild(document.createTextNode(eyebrowText));

  const eyebrowLinkCell = document.createDocumentFragment();
  eyebrowLinkCell.appendChild(cellComment('eyebrowLink'));
  if (eyebrowLink && eyebrowLink.getAttribute('href')) {
    const a = document.createElement('a');
    a.href = eyebrowLink.getAttribute('href');
    a.textContent = eyebrowText || eyebrowLink.getAttribute('href');
    eyebrowLinkCell.appendChild(a);
  }

  const titleCell = document.createDocumentFragment();
  titleCell.appendChild(cellComment('title'));
  const h1 = element.querySelector('.upspr-two-column_title h1, h1');
  if (h1) {
    const h = document.createElement('h1');
    h.textContent = h1.textContent.trim();
    titleCell.appendChild(h);
  }

  const descCell = document.createDocumentFragment();
  descCell.appendChild(cellComment('description'));
  const descEl = element.querySelector('.upspr-two-column_subtext');
  if (descEl && descEl.textContent.trim()) {
    const p = document.createElement('p');
    p.textContent = descEl.textContent.trim();
    descCell.appendChild(p);
  }

  const dateEl = element.querySelector('.upspr-byline .upspr-story-date, .upspr-story-date');
  const dateCell = document.createDocumentFragment();
  dateCell.appendChild(cellComment('articleDate'));
  if (dateEl) dateCell.appendChild(document.createTextNode(dateEl.textContent.trim()));

  const hideReadTimeCell = document.createDocumentFragment();
  hideReadTimeCell.appendChild(cellComment('hideReadTime'));
  hideReadTimeCell.appendChild(document.createTextNode('false'));

  const headerBlock = WebImporter.Blocks.createBlock(document, {
    name: 'article-header',
    cells: [
      [eyebrowCell],
      [eyebrowLinkCell],
      [titleCell],
      [descCell],
      [dateCell],
      [hideReadTimeCell],
    ],
  });

  // ---- hero image (default content) ----
  let heroPicture = null;
  const heroImg = element.querySelector('.upspr-heroimage img, img.upspr-heroimage_img');
  if (heroImg) {
    const src = heroImg.getAttribute('src') || heroImg.getAttribute('data-src');
    if (src) {
      const img = document.createElement('img');
      img.src = src;
      img.alt = heroImg.getAttribute('alt') || '';
      const p = document.createElement('p');
      p.appendChild(img);
      heroPicture = p;
    }
  }

  // ---- body (rich text) for the left column (width 8) ----
  const bodyFrag = document.createElement('div');
  const body = element.querySelector('.cmp-text');
  const BLOCK_SEL = 'p, ul, ol, h2, h3, h4, h5, h6, table';
  if (body) {
    // Collect body block nodes in document order. Some pages wrap tables (and
    // other content) in intermediate <div>s, so a `:scope > table` selector
    // misses them (e.g. the 1Q-2018 earnings page had 3 segment tables nested
    // one level deep). Walk the direct children: keep recognized block nodes
    // as-is; for a wrapper element, pull out its block descendants (tables
    // included) in order so nothing is dropped.
    [...body.children].forEach((child) => {
      const tag = child.tagName.toLowerCase();
      if (child.matches(BLOCK_SEL)) {
        bodyFrag.appendChild(child.cloneNode(true));
      } else if (tag !== 'style' && tag !== 'script') {
        const inner = child.querySelectorAll(BLOCK_SEL);
        if (inner.length) {
          inner.forEach((n) => bodyFrag.appendChild(n.cloneNode(true)));
        } else if (child.textContent.trim()) {
          // wrapper with only inline text -> preserve as a paragraph
          const p = document.createElement('p');
          p.innerHTML = child.innerHTML.trim();
          bodyFrag.appendChild(p);
        }
      }
    });
    // Fallback: some pages put the body as bare text / inline nodes directly in
    // .cmp-text (no block wrappers), so the walk above finds nothing. Wrap the
    // whole .cmp-text content in a paragraph so the body survives.
    if (!bodyFrag.childNodes.length && body.textContent.trim()) {
      const p = document.createElement('p');
      p.innerHTML = body.innerHTML.trim();
      bodyFrag.appendChild(p);
    }
  }
  const leftCol = document.createElement('div');
  leftCol.appendChild(bodyFrag);

  // ---- social-share block for the right column (width 4) ----
  const shareLabelCell = document.createDocumentFragment();
  shareLabelCell.appendChild(cellComment('label'));
  const socialBlock = WebImporter.Blocks.createBlock(document, {
    name: 'social-share',
    cells: [[shareLabelCell]],
  });
  const rightCol = document.createElement('div');
  rightCol.appendChild(socialBlock);

  // ---- Column Control (8/4) ----
  // The layout travels as the container's `classes` value (block-option in the
  // name parenthetical -> `layout-8-4` class). Column cells are content
  // drop-zones; the block JS reads the layout preset to size them 8/4.
  const gridBlock = WebImporter.Blocks.createBlock(document, {
    name: 'Column Control (layout-8-4)',
    cells: [[leftCol, rightCol]],
  });

  // ---- breadcrumb block (crumbs built dynamically from the page path) ----
  const breadcrumbCell = document.createDocumentFragment();
  breadcrumbCell.appendChild(document.createTextNode('Home'));
  const breadcrumbBlock = WebImporter.Blocks.createBlock(document, {
    name: 'Breadcrumb',
    cells: [[breadcrumbCell]],
  });

  // Assemble the container that replaces the source region.
  const container = document.createElement('div');
  container.setAttribute('data-article-root', 'true');
  container.appendChild(breadcrumbBlock);
  container.appendChild(headerBlock);
  if (heroPicture) container.appendChild(heroPicture);
  container.appendChild(gridBlock);
  element.replaceWith(container);
}
