// Button — renders an authored label as a styled CTA. When a link is provided
// it renders as an anchor; otherwise as a <button>. Style (primary / secondary
// / tertiary) and an optional custom class control appearance.
//
// Authored cells, in model order: label, link, customClass, style.

const STYLE_CLASS = {
  primary: 'cmp-button--primary',
  secondary: 'cmp-button--secondary',
  tertiary: 'cmp-button--tertiary',
};

// Build the CTA element (shared with other blocks, e.g. content-list Load More).
// Returns an <a> when href is set, else a <button>. Applies the cmp-button
// base class, the style variant, and any extra classes.
export function createButton({
  label, href, style, customClass, type = 'button',
} = {}) {
  const el = href ? document.createElement('a') : document.createElement('button');
  el.classList.add('cmp-button');
  const variant = STYLE_CLASS[(style || '').toLowerCase()];
  if (variant) el.classList.add(variant);
  if (customClass) el.classList.add(...customClass.split(/\s+/).filter(Boolean));

  if (href) {
    el.href = href;
  } else {
    el.type = type;
  }

  const text = document.createElement('span');
  text.className = 'cmp-button__text';
  text.textContent = label || '';
  el.append(text);
  return el;
}

function cellText(row) {
  return row ? row.textContent.trim() : '';
}

export default function decorate(block) {
  const rows = [...block.children];
  const label = cellText(rows[0]);
  const link = rows[1]?.querySelector('a');
  const href = link ? link.getAttribute('href') : cellText(rows[1]);
  const customClass = cellText(rows[2]);
  const style = cellText(rows[3]) || 'primary';

  const el = createButton({
    label, href, style, customClass,
  });
  block.replaceChildren(el);
}
