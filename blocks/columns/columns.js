import { decorateBlock, loadBlock, toClassName } from '../../scripts/aem.js';

// Parse a `layout-N-N...` class into an array of 12-grid widths, e.g.
// `layout-3-3-6` -> [3, 3, 6]. Returns null when no layout class is present.
function readLayout(block) {
  const cls = [...block.classList].find((c) => /^layout-\d+(-\d+)*$/.test(c));
  return cls ? cls.replace('layout-', '').split('-').map(Number) : null;
}

// Apply Bootstrap-style col-lg-* spans to each column cell based on the layout
// preset. When the preset length doesn't match the actual column count (author
// changed the count without updating the layout), fall back to an equal split.
function applyLayout(cols, layout) {
  const n = cols.length || 1;
  let widths = layout;
  if (!widths || widths.length !== n) {
    const base = Math.floor(12 / n);
    widths = new Array(n).fill(base);
    widths[n - 1] += 12 - base * n;
  }
  cols.forEach((col, i) => col.classList.add(`col-lg-${widths[i]}`));
}

// Convert a nested block authored as a raw <table> (delivered inside a column —
// the EDS pipeline only converts top-level block tables) into standard block
// DOM: <div class="<name> block"> rows/cells </div>.
function tableToBlock(table) {
  const headerText = table.querySelector('thead th, thead td')?.textContent.trim() || '';
  if (!headerText) return;
  const name = toClassName(headerText);
  const wrapper = document.createElement('div');
  wrapper.className = `${name} block`;
  wrapper.dataset.blockName = name;
  table.querySelectorAll('tbody tr').forEach((tr) => {
    const rowDiv = document.createElement('div');
    [...tr.children].forEach((td) => {
      const cellDiv = document.createElement('div');
      cellDiv.append(...td.childNodes);
      rowDiv.append(cellDiv);
    });
    wrapper.append(rowDiv);
  });
  table.replaceWith(wrapper);
}

// Decorate + load any blocks authored inside the column cells. EDS only auto-
// decorates top-level section blocks, so a block nested in a column (e.g. Title,
// Social Share) would otherwise render its raw cells. Handle raw <table> markup
// too, and search at any depth (the pipeline may wrap a block in a <p>/<div>).
async function loadNestedBlocks(cols) {
  cols.forEach((col) => {
    col.querySelectorAll(':scope table').forEach((table) => tableToBlock(table));
  });
  const nested = cols.flatMap((col) => [
    ...col.querySelectorAll('div[data-aue-component]:not([data-block-status]), div[data-block-name]:not([data-block-status])'),
  ]);
  await Promise.all(nested.map(async (el) => {
    const wrapper = document.createElement('div');
    el.replaceWith(wrapper);
    wrapper.append(el);
    decorateBlock(el);
    await loadBlock(el);
  }));
}

export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  // Layout preset (from a `layout-*` class) drives per-column widths on a
  // 12-unit grid; styled in columns.css.
  const layout = readLayout(block);
  if (layout) applyLayout(cols, layout);

  // setup image columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          // picture is only content in column
          picWrapper.classList.add('columns-img-col');
        }
      }
    });
  });

  // Decorate blocks nested inside the columns (e.g. Title, Social Share).
  loadNestedBlocks(cols);
}
