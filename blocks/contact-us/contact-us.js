import { moveInstrumentation } from '../../scripts/scripts.js';

// Contact Us — a white card with a title and two authored parts side by side
// (source: .upspr-contactus "Media Resources" on /us/en/newsroom/negotiations).
//
// Authoring model (see _contact-us.json), one row per field:
//   Row 1: title  (text)      -> <h3> across the top of the card
//   Row 2: left   (richtext)  -> left part (heading, text, contact list)
//   Row 3: right  (richtext)  -> right part (e.g. additional information)
// Block option (classes): full-width -> card spans the whole content width.
//
// Contact list items get an icon from the link they contain: tel: -> phone,
// mailto: -> mail, twitter.com / x.com -> X. Links stay plain links (the
// global single-link "button" decoration is undone inside the card).

const ICONS = [
  { test: (href) => href.startsWith('tel:'), icon: 'upspr-icon-phone' },
  { test: (href) => href.startsWith('mailto:'), icon: 'upspr-icon-mail-circle' },
  // The source's twitter-circle glyph (\e900) is empty in this project's
  // upspricons font (and its x-circle is a close icon), so Twitter/X links use
  // the X logo from icons/x.svg, drawn by CSS.
  { test: (href) => /^https?:\/\/(www\.)?(twitter|x)\.com\//i.test(href), icon: 'contact-us-icon-x' },
];

// Undo decorateButtons() for links authored on their own line.
function unbutton(container) {
  container.querySelectorAll('.button-container').forEach((p) => p.classList.remove('button-container'));
  container.querySelectorAll('a.button').forEach((a) => a.classList.remove('button', 'primary', 'secondary'));
}

// Prefix list items that hold a contact link with the matching icon.
function decorateContactList(container) {
  container.querySelectorAll('li').forEach((li) => {
    const href = li.querySelector('a[href]')?.getAttribute('href') || '';
    const match = ICONS.find(({ test }) => test(href));
    if (!match) return;
    const text = document.createElement('span');
    text.className = 'contact-us-item-text';
    text.append(...li.childNodes);
    const icon = document.createElement('i');
    icon.className = match.icon;
    icon.setAttribute('aria-hidden', 'true');
    li.classList.add('contact-us-item-icon');
    li.append(icon, text);
  });
}

// The authored cell of a row (rows hold a single cell).
const cellOf = (row) => row?.firstElementChild || row;

export default function decorate(block) {
  const [titleRow, leftRow, rightRow] = block.children;

  const card = document.createElement('div');
  card.className = 'contact-us-card';

  const titleCell = cellOf(titleRow);
  const titleText = titleCell?.textContent.trim();
  if (titleText) {
    const h3 = document.createElement('h3');
    h3.className = 'contact-us-title';
    h3.textContent = titleText;
    // decorateBlock() wraps plain text in a <p> and moves the field's
    // instrumentation onto it, so take it from wherever it ended up.
    moveInstrumentation(titleCell.querySelector('[data-aue-prop]') || titleCell, h3);
    card.append(h3);
  }

  const columns = document.createElement('div');
  columns.className = 'contact-us-columns';
  [[leftRow, 'contact-us-left'], [rightRow, 'contact-us-right']].forEach(([row, className]) => {
    // Reuse the authored cell itself so its richtext instrumentation is kept.
    const cell = cellOf(row);
    if (!cell) return;
    // An empty part is dropped on the site, but kept in the Universal Editor
    // (instrumented cell) so it can still be selected and filled in.
    const empty = !cell.textContent.trim() && !cell.querySelector('img');
    const instrumented = [...cell.attributes].some(({ name }) => name.startsWith('data-aue-') || name.startsWith('data-richtext-'));
    if (empty && !instrumented) return;
    cell.classList.add(className);
    unbutton(cell);
    decorateContactList(cell);
    columns.append(cell);
  });
  // Single-part cards drop the divider (see CSS :only-child).
  card.append(columns);

  block.replaceChildren(card);
}
