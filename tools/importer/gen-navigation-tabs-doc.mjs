/* eslint-disable */
import { writeFile } from 'fs/promises';
const require = (await import('module')).createRequire(import.meta.url);
const DOCX = '/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts/node_modules/docx';
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  Table, TableRow, TableCell, WidthType, AlignmentType,
} = require(DOCX);

const BROWN = '351C15';
const h1 = (txt) => new Paragraph({ text: txt, heading: HeadingLevel.HEADING_1, spacing: { after: 160 } });
const h2 = (txt) => new Paragraph({ text: txt, heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 120 } });
const t = (text, o = {}) => new TextRun({ text, ...o });
const b = (text) => t(text, { bold: true });
const p = (runs) => new Paragraph({ children: Array.isArray(runs) ? runs : [new TextRun(runs)], spacing: { after: 120 } });
const bullet = (runs, level = 0) => new Paragraph({ children: Array.isArray(runs) ? runs : [new TextRun(runs)], bullet: { level }, spacing: { after: 60 } });
// Each numbered list has its own reference so numbering restarts at 1.
const step = (list) => (runs) => new Paragraph({ children: Array.isArray(runs) ? runs : [new TextRun(runs)], numbering: { reference: list, level: 0 }, spacing: { after: 60 } });
const addStep = step('add');
const staticStep = step('static');
const dynamicStep = step('dynamic');

function cell(text, { header = false, width } = {}) {
  return new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text, bold: header, color: header ? 'FFFFFF' : undefined })] })],
    width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
    shading: header ? { fill: BROWN } : undefined,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
  });
}

function table(headers, widths, rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ tableHeader: true, children: headers.map((h, i) => cell(h, { header: true, width: widths[i] })) }),
      ...rows.map((r) => new TableRow({ children: r.map((c, i) => cell(c, { width: widths[i] })) })),
    ],
  });
}

const fields = [
  ['Navigation Label', 'Text shown on the tab. Required; up to 24 characters.'],
  ['Navigation Links', 'The page the tab opens. Required; pick a page below /content/about-ups-eds.'],
  ['Open in New Window', 'Opens the page in a new browser tab when switched on.'],
];

const troubleshooting = [
  ['Clicking + seems to do nothing', 'The new tab is added as a dashed placeholder; if you still don\'t see it, check the content tree under the block. If the block was inserted a while ago and + offers nothing at all, delete it and insert a new Navigation Tabs block.'],
  ['A tab doesn\'t show on the published page', 'Fill in both Navigation Label and Navigation Links.'],
  ['Dynamic shows no tabs on the site', 'Check that the Navigation Root is a published page under /us/en and that it has child pages.'],
];

const recipes = [
  ['One tab to a related page', 'Tabs source: Static. + → Navigation Tab: label "Industry overview", link the page.'],
  ['Tabs for every section page', 'Tabs source: Dynamic. Navigation Root: the parent page.'],
  ['Tab that opens in a new window', 'Static tab with Open in New Window on.'],
  ['Change the tab order', 'Static: drag the tabs in the content tree. Dynamic: reorder the pages in AEM (editor) — the site follows the page index.'],
];

const numbered = (reference) => ({ reference, levels: [{ level: 0, format: 'decimal', text: '%1.', alignment: AlignmentType.START }] });

const doc = new Document({
  creator: 'UPS EDS',
  title: 'Navigation Tabs — Authoring Guide',
  styles: {
    default: {
      document: { run: { font: 'Calibri', size: 22 } },
      heading1: { run: { font: 'Calibri', size: 40, bold: true, color: BROWN } },
      heading2: { run: { font: 'Calibri', size: 30, bold: true, color: BROWN } },
    },
  },
  numbering: { config: [numbered('add'), numbered('static'), numbered('dynamic')] },
  sections: [{
    children: [
      h1('Navigation Tabs — Authoring Guide'),
      p('The Navigation Tabs block shows a row of links for navigating between related pages. Each tab is a white card with the page name, a gold line along the bottom and a blue circled arrow (e.g. "Industry overview" on the Negotiations page).'),

      h2('Adding the block'),
      addStep('Open the page in the Universal Editor.'),
      addStep([t('In the section where you want the tabs, click the '), b('+'), t(' (Insert) control and choose '), b('Navigation Tabs'), t('.')]),
      addStep([t('Select the block and choose a '), b('Tabs source'), t(' in the properties panel.')]),

      h2('Tabs source'),
      bullet([b('Static'), t(' (default) — you add each tab yourself (see below).')]),
      bullet([b('Dynamic'), t(' — the block creates one tab for each page directly below a page you choose (see below).')]),

      h2('Static tabs'),
      staticStep([t('Select the '), b('Navigation Tabs'), t(' block (on the page or in the content tree).')]),
      staticStep([t('Click '), b('+'), t(' (Add) on the block. A new '), b('Navigation Tab'), t(' is added straight away — there is no menu, because it is the only item the block accepts. In the editor it appears as a dashed placeholder reading "New tab: add a label and link".')]),
      staticStep('Select the new tab and fill in its fields:'),
      table(['Field', 'Description'], [30, 70], fields),
      staticStep([t('Repeat '), b('+'), t(' for each tab. Reorder or delete tabs in the content tree.')]),
      p([t('A tab missing its label or link stays a dashed placeholder in the editor and is '), b('not shown'), t(' on the published page.')]),

      h2('Dynamic tabs'),
      dynamicStep([t('Set '), b('Tabs source'), t(' to '), b('Dynamic'), t('. The '), b('Navigation Root'), t(' field appears.')]),
      dynamicStep([t('Pick the '), b('Navigation Root'), t(' page (below /content/about-ups-eds).')]),
      p([t('The block creates one tab for each page '), b('directly'), t(' below that root — pages further down are not included. Tabs always open in the same window. Any Static tabs left on the block are ignored while Dynamic is selected.')]),
      p([b('Tab labels and order:')]),
      bullet([b('In the Universal Editor'), t(' the tabs are read from AEM, in the same order as the pages in AEM. The label is the page\'s Page Title (SEO title) if set, otherwise its Navigation Title, otherwise its Title, otherwise the page name.')]),
      bullet([b('On the preview and live site'), t(' the tabs are read from the site\'s page index. The label is the page\'s title (without a trailing " | About UPS"), otherwise the page name. The order follows the page index.')]),
      p([b('Only published pages appear on the site.'), t(' The page index only contains pages published to the site (/content/about-ups-eds/us/en/…). A root elsewhere — for example under language-masters — shows its tabs in the editor, but no tabs on the preview or live site. Pages rolled out from a language master to /us/en normally get their Navigation Root updated to the live copy.')]),

      h2('Layout'),
      bullet([b('Desktop (>= 992px): '), t('up to three 360px tabs per row, centred. More tabs wrap to a new, centred row.')]),
      bullet([b('Tablet and mobile (< 992px): '), t('tabs stack full width.')]),
      bullet('On hover (or keyboard focus) the arrow slides slightly to the right.'),

      h2('Example'),
      p([t('A Dynamic block with Navigation Root /content/about-ups-eds/us/en/newsroom creates the tabs '), b('Press Releases'), t(', '), b('Statements'), t(' and '), b('Negotiations'), t(' — one for each page directly below Newsroom.')]),

      h2('Troubleshooting'),
      table(['Problem', 'What to do'], [34, 66], troubleshooting),

      h2('Quick recipes'),
      table(['Goal', 'Steps'], [34, 66], recipes),
    ],
  }],
});

const buf = await Packer.toBuffer(doc);
await writeFile(process.argv[2], buf);
console.log('wrote', process.argv[2], buf.length, 'bytes');
