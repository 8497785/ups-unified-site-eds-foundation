// Downloads — a titled list of downloadable asset links.
// First row is the optional section title; each following row is an item whose
// cell contains an anchor to the asset.

export default function decorate(block) {
  const rows = [...block.children];
  const [titleRow, ...itemRows] = rows;

  const wrap = document.createElement('div');
  wrap.className = 'downloads-list';

  const titleText = titleRow ? titleRow.textContent.trim() : '';
  if (titleText) {
    const h = document.createElement('p');
    h.className = 'downloads-title';
    h.textContent = titleText;
    wrap.append(h);
  }

  const ul = document.createElement('ul');
  itemRows.forEach((row) => {
    const anchor = row.querySelector('a');
    if (!anchor) return;
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = anchor.getAttribute('href');
    a.textContent = anchor.textContent.trim() || anchor.getAttribute('href');
    a.className = 'downloads-link';
    a.setAttribute('download', '');
    li.append(a);
    ul.append(li);
  });

  if (ul.children.length) wrap.append(ul);
  block.replaceChildren(wrap);
}
