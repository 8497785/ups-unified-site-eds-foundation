// Article Header — eyebrow (with optional link), title, description, date, read time.
// Cell order matches the model: eyebrow, eyebrowLink, title, description,
// articleDate, hideReadTime.
//
// Eyebrow Title and Eyebrow Link are authored: the label is the eyebrow text and
// the link is an aem-content reference to the parent "category" page. The link
// is delivered as a raw /content/about-ups-eds/... JCR path, so it is normalized
// to a clean served URL at render time.

const WORDS_PER_MINUTE = 200;
const CONTENT_PREFIX = '/content/about-ups-eds';

function cellText(row) {
  return row ? row.textContent.trim() : '';
}

function estimateReadTime() {
  const body = document.querySelector('main');
  const words = body ? body.textContent.trim().split(/\s+/).length : 0;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

// Normalize an authored aem-content link to a clean served URL: strip the
// content-source prefix and any .html suffix. Idempotent and safe for links
// that are already clean.
function normalizeLink(href) {
  if (!href) return href;
  return href.replace(new RegExp(`^${CONTENT_PREFIX}`), '').replace(/\.html$/, '');
}

export default function decorate(block) {
  const rows = [...block.children];
  const [eyebrowRow, eyebrowLinkRow, titleRow, descRow, dateRow, hideReadRow] = rows;

  // Eyebrow Link + Title: authored. Link is an aem-content ref, normalized to
  // the clean served path.
  const eyebrowHref = normalizeLink(
    eyebrowLinkRow?.querySelector('a')?.getAttribute('href') || cellText(eyebrowLinkRow),
  );
  const eyebrowText = cellText(eyebrowRow);

  const titleEl = titleRow?.querySelector('h1, h2, h3') || titleRow;
  const descEl = descRow?.querySelector('p') || descRow;
  const dateText = cellText(dateRow);
  const hideReadTime = /^(true|yes|on)$/i.test(cellText(hideReadRow));

  const header = document.createElement('div');
  header.className = 'article-header-content';

  if (eyebrowText) {
    const eyebrow = document.createElement('p');
    eyebrow.className = 'article-header-eyebrow';
    if (eyebrowHref) {
      const a = document.createElement('a');
      a.href = eyebrowHref;
      a.textContent = eyebrowText;
      eyebrow.append(a);
    } else {
      eyebrow.textContent = eyebrowText;
    }
    header.append(eyebrow);
  }

  if (titleEl && titleEl.textContent.trim()) {
    const h1 = document.createElement('h1');
    h1.className = 'article-header-title';
    h1.textContent = titleEl.textContent.trim();
    header.append(h1);
  }

  const byline = document.createElement('p');
  byline.className = 'article-header-byline';
  if (dateText) {
    const dateSpan = document.createElement('span');
    dateSpan.className = 'article-header-date';
    dateSpan.textContent = dateText;
    byline.append(dateSpan);
  }
  if (!hideReadTime) {
    const readSpan = document.createElement('span');
    readSpan.className = 'article-header-readtime';
    readSpan.textContent = `${estimateReadTime()} MIN READ`;
    byline.append(readSpan);
  }
  if (byline.childElementCount) header.append(byline);

  if (descEl && descEl.textContent.trim()) {
    const desc = document.createElement('p');
    desc.className = 'article-header-description';
    desc.textContent = descEl.textContent.trim();
    header.append(desc);
  }

  block.replaceChildren(header);
}
