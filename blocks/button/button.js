// Button — renders an authored label as a styled CTA. When a link is provided
// it renders as an anchor; otherwise as a <button>. Style (primary / secondary)
// and an optional custom class control appearance.
//
// Authored cells, in model order: label, link, customClass, style.

const STYLE_CLASS = {
  primary: 'cmp-button--primary',
  secondary: 'cmp-button--secondary',
};

const ALIGN_CLASS = {
  left: 'cmp-button--align-left',
  center: 'cmp-button--align-center',
  right: 'cmp-button--align-right',
};

// Build the CTA element (shared with other blocks, e.g. content-list Load More).
// Returns an <a> when href is set, else a <button>. Applies the cmp-button
// base class, the style variant, alignment, and any extra classes.
export function createButton({
  label, href, style, alignment, customClass, type = 'button',
} = {}) {
  const el = href ? document.createElement('a') : document.createElement('button');
  el.classList.add('cmp-button');
  const variant = STYLE_CLASS[(style || '').toLowerCase()];
  if (variant) el.classList.add(variant);
  const align = ALIGN_CLASS[(alignment || '').toLowerCase()];
  if (align) el.classList.add(align);
  if (customClass) el.classList.add(...customClass.split(/\s+/).filter(Boolean));

  if (href) {
    el.href = href;
  } else {
    el.type = type;
  }

  const text = document.createElement('span');
  text.className = 'cmp-button__text';
  text.textContent = label || '';

  const icon = document.createElement('span');
  icon.className = 'upspr upspr-icon-chevronright';

  el.append(text, icon);
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
  const alignment = cellText(rows[4]) || 'left';

  const el = createButton({
    label, href, style, alignment, customClass,
  });
  block.replaceChildren(el);
}
