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

// Convert a nested block authored as a raw <table> into standard EDS block DOM:
// <div class="<name> block"> rows/cells </div>.
//
// WHY tables: a block nested in a column is NOT a top-level section block, and
// the crosswalk -> helix-md2jcr delivery pipeline only converts top-level block
// tables. A nested block *node* is flattened on delivery to a classless <div>
// (its block identity is lost), so it can't be reconstructed client-side. The
// durable carrier for a nested block is therefore a table whose header cell
// names the block; it survives md2jcr intact and we rebuild the block DOM from
// it here at runtime.
//
// The header cell may carry a variant, e.g. "Cards (logos)" -> classes
// ["cards", "logos"]; the first token is the block name.
function tableToBlock(table) {
  const headerText = table.querySelector('thead th, thead td')?.textContent.trim() || '';
  if (!headerText) return;
  const classes = headerText
    .split(/[(),]/) // "Name (variant)" -> ["Name ", " variant", ""]
    .map((s) => toClassName(s.trim()))
    .filter(Boolean);
  if (!classes.length) return;
  const [name] = classes;
  const wrapper = document.createElement('div');
  wrapper.className = `${classes.join(' ')} block`;
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
// Social Share) would otherwise render its raw cells.
//
// Detection is CLASS-based, not attribute-based: on the published .page a nested
// block is delivered as a table carrier (rebuilt to a classed block div by
// tableToBlock above), and UE-only `data-aue-*` attributes are stripped — so a
// `data-aue-component`/`data-block-name` selector matches nothing on delivery
// (this was the bug: nested blocks stayed plain HTML on .page). Search
// descendants (the pipeline may wrap a nested block in a <p>/<div>), take
// undecorated classed divs, and exclude the column cells themselves and the
// picture-column wrapper.
async function loadNestedBlocks(cols) {
  cols.forEach((col) => {
    col.querySelectorAll(':scope table').forEach((table) => tableToBlock(table));
  });
  const nested = cols.flatMap((col) => [
    ...col.querySelectorAll('div[class]:not([data-block-status])'),
  ].filter((el) => el.classList.length
    && !el.classList.contains('columns-img-col')
    && !cols.includes(el)));
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
