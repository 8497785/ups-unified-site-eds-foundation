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
const p = (runs) => new Paragraph({ children: Array.isArray(runs) ? runs : [new TextRun(runs)], spacing: { after: 120 } });
const bullet = (runs) => new Paragraph({ children: Array.isArray(runs) ? runs : [new TextRun(runs)], bullet: { level: 0 }, spacing: { after: 60 } });
const step = (ref) => (runs) => new Paragraph({ children: Array.isArray(runs) ? runs : [new TextRun(runs)], numbering: { reference: ref, level: 0 }, spacing: { after: 60 } });
const addStep = step('add');
const cfStep = step('cf');

function cell(text, { header = false, width } = {}) {
  return new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text, bold: header, color: header ? 'FFFFFF' : undefined })] })],
    width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
    shading: header ? { fill: BROWN } : undefined,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
  });
}

function table(headers, rows, widths) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ tableHeader: true, children: headers.map((h, i) => cell(h, { header: true, width: widths[i] })) }),
      ...rows.map((r) => new TableRow({ children: r.map((c, i) => cell(c, { width: widths[i] })) })),
    ],
  });
}

const fields = [
  ['Small uppercase label with a gold line', 'Eyebrow (links to the Eyebrow Link page, if one is set)'],
  ['Heading', 'Title'],
  ['Date, shown as MM-DD-YYYY', 'Award Date'],
  ['Text after the date', 'Description'],
  ['Read More › link', 'CTA Link (no link means no Read More)'],
  ['Read More opens in a new tab', 'Link Action checked; unchecked opens in the same tab'],
];

const messages = [
  ['Select an awards folder to see the list.', 'No folder picked yet.'],
  ['No awards found in /content/dam/upsstories/awards/2026/', 'The folder has no award fragments (or they can\'t be read). On the published page the block is hidden.'],
];

const recipes = [
  ['One list per year', 'For each year add a Title block (e.g. "2026"), then an Awards CF List with that year\'s folder.'],
  ['Add a new award', 'Create the award Content Fragment in its year folder, fill the fields, publish it. The list updates on its own.'],
  ['Read More in a new tab', 'In the award\'s Content Fragment, check Link Action.'],
  ['Hide Read More', 'Leave the award\'s CTA Link empty.'],
];

const doc = new Document({
  creator: 'UPS EDS',
  title: 'Awards CF List — Authoring Guide',
  styles: {
    default: {
      document: { run: { font: 'Calibri', size: 22 } },
      heading1: { run: { font: 'Calibri', size: 40, bold: true, color: BROWN } },
      heading2: { run: { font: 'Calibri', size: 30, bold: true, color: BROWN } },
    },
  },
  numbering: {
    config: ['add', 'cf'].map((reference) => ({ reference, levels: [{ level: 0, format: 'decimal', text: '%1.', alignment: AlignmentType.START }] })),
  },
  sections: [{
    children: [
      h1('Awards CF List — Authoring Guide'),
      p([t('The Awards CF List shows a list of awards and recognitions, the same as on the '), t('Newsroom → Awards and Recognition', { bold: true }), t(' page. The awards themselves are '), t('Content Fragments', { bold: true }), t(' in AEM Assets. The block only points at a year folder and lists every award in it, newest first. To change an award\'s text, edit its Content Fragment, not the page.')]),

      h2('Adding the block'),
      addStep('Open the page in the Universal Editor.'),
      addStep([t('In the section where you want the list, click the '), t('+', { bold: true }), t(' (Insert) control and choose '), t('Awards CF List', { bold: true }), t('.')]),
      addStep([t('Select the block, open the properties panel, and pick the '), t('Awards Folder', { bold: true }), t('.')]),

      h2('Field'),
      bullet([t('Awards Folder', { bold: true }), t(': pick a year folder (e.g. '), t('2026', { bold: true }), t(') to list that year\'s awards. The picker opens at /content/dam/upsstories/awards and only lets you choose folders inside it.')]),
      p('Until a folder is picked, the block shows a grey placeholder with "Select an awards folder to see the list." in the editor, and nothing on the published page.'),

      h2('What each award shows'),
      p('Each item in the list comes from one award Content Fragment:'),
      table(['On the page', 'Content Fragment field'], fields, [40, 60]),
      p(''),
      p([t('Awards are sorted by '), t('Award Date', { bold: true }), t(', newest first.')]),
      p('The Content Fragment editor may label these fields slightly differently. They are the eyebrow, eyebrowLink, title, awardDate, description, ctaLink and linkAction fields of the award model.'),

      h2('Adding or changing awards'),
      cfStep([t('In '), t('Assets → Files', { bold: true }), t(', go to /content/dam/upsstories/awards/<year>/.')]),
      cfStep('Create a Content Fragment with the award model, or edit an existing one, and fill in the fields above.'),
      cfStep([t('Publish', { bold: true }), t(' the Content Fragment. The published site only lists published awards. In the editor, reload the page to see changes.')]),
      p('For a new year, create the year folder (e.g. 2027) under awards first, then add the award fragments to it.'),

      h2('Layout'),
      bullet([t('Desktop (>= 1024px): ', { bold: true }), t('a single column, 77% of the page width, centered.')]),
      bullet([t('Tablet and mobile (< 1024px): ', { bold: true }), t('full width.')]),
      bullet('Awards are separated by a thin grey line.'),

      h2('Messages you may see in the editor'),
      table(['Message', 'Meaning'], messages, [45, 55]),

      h2('Quick recipes'),
      table(['Goal', 'Steps'], recipes, [34, 66]),
    ],
  }],
});

const buf = await Packer.toBuffer(doc);
await writeFile(process.argv[2], buf);
console.log('wrote', process.argv[2], buf.length, 'bytes');
