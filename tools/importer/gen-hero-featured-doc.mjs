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
const bullet = (runs, level = 0) => new Paragraph({ children: Array.isArray(runs) ? runs : [new TextRun(runs)], bullet: { level }, spacing: { after: 60 } });
const step = (runs) => new Paragraph({ children: Array.isArray(runs) ? runs : [new TextRun(runs)], numbering: { reference: 'steps', level: 0 }, spacing: { after: 60 } });

function cell(text, { header = false, width } = {}) {
  return new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text, bold: header, color: header ? 'FFFFFF' : undefined })] })],
    width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
    shading: header ? { fill: BROWN } : undefined,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
  });
}

const recipes = [
  ['Story hero with eyebrow from the section page', 'Eyebrow: Dynamic. Link: the story page. CTA text: e.g. "Read more".'],
  ['Hero with a custom eyebrow', 'Eyebrow: Static. Eyebrow text: your label. Eyebrow link: the page it should open. Fill Link + CTA text for the button.'],
  ['Hero with no eyebrow', 'Eyebrow: None. Fill Link + CTA text for the button.'],
  ['Hero with no button', 'Leave CTA text empty (Link can stay filled if a Dynamic eyebrow needs it).'],
  ['Card on the right, rounded corners', 'Presentation: Rounded corners + Align card right.'],
];

const table = new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  rows: [
    new TableRow({ tableHeader: true, children: [cell('Goal', { header: true, width: 34 }), cell('Steps', { header: true, width: 66 })] }),
    ...recipes.map(([g, s]) => new TableRow({ children: [cell(g, { width: 34 }), cell(s, { width: 66 })] })),
  ],
});

const doc = new Document({
  creator: 'UPS EDS',
  title: 'Hero Featured — Authoring Guide',
  styles: {
    default: {
      document: { run: { font: 'Calibri', size: 22 } },
      heading1: { run: { font: 'Calibri', size: 40, bold: true, color: BROWN } },
      heading2: { run: { font: 'Calibri', size: 30, bold: true, color: BROWN } },
    },
  },
  numbering: {
    config: [{ reference: 'steps', levels: [{ level: 0, format: 'decimal', text: '%1.', alignment: AlignmentType.START }] }],
  },
  sections: [{
    children: [
      h1('Hero Featured — Authoring Guide'),
      p('The Hero Featured block shows a large background image with a white content card on top of it. The card holds an eyebrow (small uppercase label with a gold accent line), a title, a short description and a gold CTA button (e.g. "Read The Statement").'),

      h2('Adding the block'),
      step('Open the page in the Universal Editor.'),
      step([t('In the section (or column) where you want the hero, click the '), t('+', { bold: true }), t(' (Insert) control and choose '), t('Hero Featured', { bold: true }), t('.')]),
      step('Select the block and fill in its fields in the properties panel.'),

      h2('Fields'),
      bullet([t('Image', { bold: true }), t(' — the background image. Pick it from Assets.')]),
      bullet([t('Alt', { bold: true }), t(' — a short description of the image for screen readers.')]),
      bullet([t('Text', { bold: true }), t(' — the card\'s title and description. Write the title as a heading and the description as a paragraph below it. Don\'t add the eyebrow or the button here — they have their own fields below.')]),
      bullet([t('Eyebrow', { bold: true }), t(' — how the eyebrow is filled:')]),
      bullet([t('Dynamic (parent page of Link)', { bold: true }), t(' (default) — the eyebrow shows the name of the parent page of the page picked in Link, and links to it. For example, if Link is …/newsroom/negotiations/faq, the eyebrow shows "Negotiations" and links to …/newsroom/negotiations.')], 1),
      bullet([t('Static (authored)', { bold: true }), t(' — you type the eyebrow text and pick its link yourself (two extra fields appear, see below).')], 1),
      bullet([t('None (no eyebrow)', { bold: true }), t(' — no eyebrow is shown.')], 1),
      bullet([t('Eyebrow text', { bold: true }), t(' (only with Static) — the eyebrow label (e.g. "2023 LABOR NEGOTIATIONS"). Leave it blank to show the name of the Eyebrow link page.')]),
      bullet([t('Eyebrow link', { bold: true }), t(' (only with Static) — the page the eyebrow links to. Leave it blank to link to the parent page of Link.')]),
      bullet([t('Link', { bold: true }), t(' — the page the CTA button links to. With a Dynamic eyebrow, this is also where the eyebrow gets its parent page from.')]),
      bullet([t('CTA text', { bold: true }), t(' — the button label (e.g. "Read more", "Read The Statement").')]),
      bullet([t('Presentation', { bold: true }), t(' — optional layout choices (see below).')]),

      h2('The CTA button'),
      p([t('The button is shown only when '), t('both Link and CTA text', { bold: true }), t(' are filled in. There is no default label — if CTA text is empty, no button appears. This keeps translated pages from showing an untranslated "Read more", so always fill in CTA text (and have it translated) when you want a button.')]),

      h2('Eyebrow text and translations'),
      p('Page names used by a Dynamic eyebrow (or a blank Static eyebrow text) come from the linked page\'s title, so they follow the page\'s translation automatically. Static eyebrow text is typed by you and needs translating like any other field.'),

      h2('Presentation (layout)'),
      bullet([t('Rounded corners', { bold: true }), t(' — rounds the hero\'s corners. Without it, the corners are square.')]),
      bullet([t('Align card left', { bold: true }), t(' — the card sits on the left (this is also the default).')]),
      bullet([t('Align card right', { bold: true }), t(' — the card moves to the right. The text inside the card stays left-aligned.')]),
      p('The hero is as wide as the page\'s normal content area, lining up with the other blocks on the page. The card always sits at the bottom of the image.'),
      bullet([t('Desktop (>= 992px): ', { bold: true }), t('the hero is at least 520px tall and the card is up to 440px wide.')]),
      bullet([t('Tablet and mobile (< 992px): ', { bold: true }), t('the hero is at least 450px tall and the card is up to 420px wide.')]),

      h2('Heroes created before these fields existed'),
      p([t('Older heroes have the eyebrow and "Read more" typed inside the Text field. Their content keeps displaying as before. Their corners are now square and they line up with the page\'s content width; tick '), t('Rounded corners', { bold: true }), t(' to get the previous rounded look. When you move such a hero to the new fields:')]),
      bullet([t('Filling in '), t('Link', { bold: true }), t(' and '), t('CTA text', { bold: true }), t(' replaces the old button typed in Text.')]),
      bullet('A Dynamic eyebrow (with Link filled in) or a Static eyebrow (with Eyebrow text or Eyebrow link filled in) replaces the old eyebrow typed in Text.'),
      bullet([t('Eyebrow '), t('None', { bold: true }), t(' hides the old eyebrow.')]),
      p([t('Then '), t('delete the old eyebrow and button from Text', { bold: true }), t(', otherwise they reappear if the new fields are cleared again.')]),

      h2('Quick recipes'),
      table,
    ],
  }],
});

const buf = await Packer.toBuffer(doc);
await writeFile(process.argv[2], buf);
console.log('wrote', process.argv[2], buf.length, 'bytes');
