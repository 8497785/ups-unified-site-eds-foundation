// Article Header — eyebrow (with optional link), title, description, date, read time.
// Cell order matches the model: eyebrow, eyebrowLink, title, description,
// articleDate, hideReadTime.

const WORDS_PER_MINUTE = 200;

function cellText(row) {
  return row ? row.textContent.trim() : '';
}

function estimateReadTime() {
  const body = document.querySelector('main');
  const words = body ? body.textContent.trim().split(/\s+/).length : 0;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

export default function decorate(block) {
  const rows = [...block.children];
  const [eyebrowRow, eyebrowLinkRow, titleRow, descRow, dateRow, hideReadRow] = rows;

  const eyebrowText = cellText(eyebrowRow);
  const eyebrowHref = eyebrowLinkRow?.querySelector('a')?.getAttribute('href') || '';
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
