/* eslint-disable no-console, max-len, no-unused-vars, object-curly-newline */
/**
 * Generates a Word document describing the Leadership Listing page:
 *   - authoring steps (how to build the page in Universal Editor)
 *   - technical implementation (how the block is built and how it works)
 *
 * OUTPUT: content/leadership-listing-guide.docx (served for preview download)
 *
 * Usage: node tools/importer/generate-leadership-listing-doc.mjs
 */
import { writeFile } from 'fs/promises';

const SKILL = '/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts/node_modules';
const docx = await import(`${SKILL}/docx/dist/index.mjs`);

const {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType,
} = docx;

// ---- helpers ---------------------------------------------------------------
const H1 = (text) => new Paragraph({ text, heading: HeadingLevel.HEADING_1, spacing: { before: 240, after: 120 } });
const H2 = (text) => new Paragraph({ text, heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 } });
const H3 = (text) => new Paragraph({ text, heading: HeadingLevel.HEADING_3, spacing: { before: 160, after: 80 } });

const P = (text) => new Paragraph({ children: [new TextRun(text)], spacing: { after: 120 } });

const bullet = (text, level = 0) => new Paragraph({
  children: [new TextRun(text)],
  bullet: { level },
  spacing: { after: 60 },
});

const numbered = (text) => new Paragraph({
  children: [new TextRun(text)],
  numbering: { reference: 'steps', level: 0 },
  spacing: { after: 80 },
});

// monospace code line
const code = (text) => new Paragraph({
  children: [new TextRun({ text, font: 'Consolas', size: 18 })],
  shading: { fill: 'F2F2F2' },
  spacing: { after: 40 },
});

const codeBlock = (lines) => lines.map(code);

// simple 2- or 3-column table with a header row
function makeTable(headers, rows) {
  const border = {
    style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC',
  };
  const borders = {
    top: border, bottom: border, left: border, right: border,
  };
  const headerCells = headers.map((h) => new TableCell({
    borders,
    shading: { fill: '351C15' },
    children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, color: 'FFFFFF' })] })],
  }));
  const bodyRows = rows.map((cells) => new TableRow({
    children: cells.map((c) => new TableCell({
      borders,
      children: [new Paragraph({ children: [new TextRun(String(c))] })],
    })),
  }));
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({ children: headerCells }), ...bodyRows],
  });
}

const title = (text) => new Paragraph({
  children: [new TextRun({ text, bold: true, size: 48, color: '351C15' })],
  alignment: AlignmentType.LEFT,
  spacing: { after: 80 },
});

const subtitle = (text) => new Paragraph({
  children: [new TextRun({ text, size: 24, color: '5F5753' })],
  spacing: { after: 240 },
});

// ---- document content ------------------------------------------------------
const children = [
  title('Leadership Listing Page'),
  subtitle('Authoring Guide & Technical Implementation — AEM Edge Delivery Services'),

  H1('1. Overview'),
  P('The Leadership Listing page presents a grid of leadership profile cards (photo, '
    + 'name, role). Each card links to that person’s bio (Leadership Details) page. '
    + 'The listing is data-driven: cards are not authored one by one. Instead, the '
    + 'block reads leadership Content Fragments from AEM via GraphQL and renders a '
    + 'card per profile, so publishing or updating a profile automatically updates the '
    + 'listing.'),
  P('This document covers two things: (A) how a content author builds and configures '
    + 'the page in the Universal Editor, and (B) how the block is implemented and how '
    + 'it works at runtime.'),

  H1('2. Prerequisites'),
  bullet('Leadership profiles exist as Content Fragments in AEM under a DAM folder (e.g. /content/dam/…/leadership).'),
  bullet('The AEM GraphQL persisted queries "leadership-list" (listing) and "leadership-details" (single bio) are deployed to the project.'),
  bullet('The author has access to the Universal Editor for the site and edit permissions on the target page.'),
  bullet('The Leadership Listing block code (JS/CSS/model) is deployed to the site (already part of this project).'),

  H1('3. Authoring Steps (Universal Editor)'),
  H2('3.1 Open the page in the Universal Editor'),
  numbered('Open the AEM author environment and navigate to the page where the listing should appear.'),
  numbered('Open the page in the Universal Editor (Edit).'),
  numbered('Ensure the Content tree shows the page → Section. Blocks are added inside a Section.'),

  H2('3.2 Add the Leadership Listing block'),
  numbered('Select the Section (or the insertion point within it).'),
  numbered('Click the add (+) control and choose "Leadership Listing" from the component list.'),
  numbered('The block is inserted. With no data configured yet, it shows a placeholder skeleton with the notice: "Select a leadership root Content Fragment to see the listing." This is expected in author.'),

  H2('3.3 Configure the block properties'),
  P('Select the block and open its properties panel. Fill in the fields below.'),
  makeTable(
    ['Field', 'Required', 'What to enter'],
    [
      ['Title', 'Optional', 'The heading shown above the grid (e.g. "Our Leadership"). Leave blank for no heading.'],
      ['Content Fragment Root Path', 'Required', 'Pick the DAM folder (or fragment) that contains the leadership profiles, using the content picker. This is what the listing reads. Until it is set, the placeholder skeleton is shown.'],
      ['Tags', 'Optional', 'One or more AEM tags to filter the profiles (e.g. show only a leadership sub-group). Leave empty to show all profiles under the root path.'],
      ['CTA Link', 'Optional', 'A link target for an optional call-to-action shown next to the title (e.g. "View all").'],
      ['CTA Text', 'Optional', 'The label for the CTA link. Both CTA Link and CTA Text must be set for the CTA to appear.'],
    ],
  ),

  H2('3.4 Verify and publish'),
  numbered('After setting the Root Path, save. In author the placeholder remains (see the note in section 5) — the live data renders on the published/preview site.'),
  numbered('Preview or Publish the page.'),
  numbered('Open the published preview URL and confirm the leadership cards render, each linking to the correct bio page.'),

  H1('4. Field Reference (Content Model)'),
  P('The block’s authorable model (blocks/leadership-listing/_leadership-listing.json):'),
  makeTable(
    ['Name', 'Component', 'Purpose'],
    [
      ['title', 'text', 'Optional heading above the grid.'],
      ['rootPath', 'aem-content (folderOrFragment, root /content/dam)', 'DAM folder/fragment root the GraphQL query reads profiles from.'],
      ['tags', 'aem-tag (string[])', 'Optional tag filter passed to the query.'],
      ['cta', 'aem-content', 'Optional CTA link target.'],
      ['ctaText', 'text', 'Optional CTA label.'],
    ],
  ),

  H1('5. How the Block Is Built (Technical Implementation)'),
  H2('5.1 File structure'),
  bullet('blocks/leadership-listing/leadership-listing.js — runtime decoration logic.'),
  bullet('blocks/leadership-listing/leadership-listing.css — grid, card, and skeleton styling.'),
  bullet('blocks/leadership-listing/_leadership-listing.json — Universal Editor component definition, model, and filters.'),
  bullet('scripts/config.js — shared helpers: getGraphQLUrl() and getDynamicMediaUrl().'),

  H2('5.2 Data source — AEM GraphQL'),
  P('The block does not store card content. It builds a GraphQL persisted-query URL and '
    + 'fetches the leadership profiles at render time. The query name is "leadership-list".'),
  P('URL construction (scripts/config.js → getGraphQLUrl):'),
  ...codeBlock([
    'getGraphQLUrl(\'leadership-list\', {',
    '  rootPath: <normalized Content Fragment Root Path>,',
    '  tag: <tags joined with "/">,',
    '});',
    '// -> <AEM_GRAPHQL_HOST>/graphql/execute.json/ups-global/leadership-list;rootPath=…;tag=…',
  ]),
  P('Parameters are appended as raw ;key=value segments (not URL-encoded) because the '
    + 'persisted query parses the literal path/tag values; encoding the slashes/colons '
    + 'would break it. Empty parameters are skipped.'),
  P('Host resolution: AEM_GRAPHQL_HOST is the absolute publish host ONLY on the EDS '
    + 'delivery tiers (*.aem.page / *.aem.live). On the author environment, localhost, '
    + 'and custom domains it is an empty string, so the call stays same-origin.'),

  H2('5.3 Decoration flow (leadership-listing.js)'),
  P('The default export decorate(block) runs when the block is loaded:'),
  bullet('Reads the authored rows in model order: title, rootPath, tags, cta, ctaText.'),
  bullet('Resolves rootPath from the cell’s link href, falling back to its text; tags are read from child elements or a comma/space-separated string.'),
  bullet('If NO root path is set → renders the placeholder skeleton (notice + skeleton cards) and returns. (This is the "no content selected" state.)'),
  bullet('Builds the header (title + optional CTA when both CTA link and text exist).'),
  bullet('Builds the GraphQL URL with normalized rootPath (strips .html and trailing slash) and tag (tags joined by "/"), then fetches the profile list.'),
  bullet('Renders one card per profile into a <ul>; a failed/empty fetch simply yields no cards (never throws).'),

  H2('5.4 Card rendering'),
  P('Each profile becomes a list item: an anchor wrapping the headshot image and a body '
    + '(name + subtitle/role). Key details:'),
  bullet('Bio link: derived from the profile’s Content Fragment path. The bio pages are children of the current listing page, so the link is <current page path>/<last segment of the CF path> (e.g. …/our-leadership/carol-tome).'),
  bullet('Headshot: uses the profile’s Dynamic Media delivery URL (_dynamicUrl) when available; getDynamicMediaUrl() appends quality=85, width, and preferwebp=true for card-sized rendering (width 400).'),
  bullet('Name is firstName + lastName; role is the subtitle field.'),

  H2('5.5 Placeholder skeleton (no content selected)'),
  P('When no root Content Fragment is selected, the block renders a placeholder so authors '
    + 'see the layout instead of an empty region:'),
  bullet('A notice line: "Select a leadership root Content Fragment to see the listing."'),
  bullet('A skeleton grid of card shells (image box + name/role lines) matching the real card layout.'),
  P('This is purely a placeholder; it does not fetch data and has no effect on the '
    + 'published render once a root path is set.'),

  H2('5.6 Author vs. delivery behavior (important)'),
  P('The AEM author host does not serve the GraphQL delivery endpoint the same way as the '
    + 'EDS delivery tiers. In the Universal Editor the block therefore shows the placeholder '
    + 'skeleton rather than live cards. Real cards render on the published preview/live '
    + '(*.aem.page / *.aem.live). This is expected and by design.'),

  H2('5.7 Styling'),
  bullet('Responsive grid: one column on small screens, two columns ≥768px.'),
  bullet('Cards: white background, rounded corners, subtle box shadow; horizontal layout with the headshot on the left and a gold accent bar above the name.'),
  bullet('Skeleton uses the same grid/card shell with neutral grey placeholder blocks.'),

  H1('6. Troubleshooting'),
  makeTable(
    ['Symptom', 'Likely cause / fix'],
    [
      ['Placeholder shows in author even after setting a root path', 'Expected — live data renders on published/preview, not in the author editor.'],
      ['No cards on the published page', 'Check the Root Path points to the correct DAM folder and that profiles are published; verify the leadership-list persisted query is deployed.'],
      ['Cards render but images are missing', 'The profile’s headshot has no Dynamic Media URL; confirm the asset and _dynamicUrl in the Content Fragment.'],
      ['Wrong bio links', 'Bio pages must be children of the listing page and named after the CF path’s last segment.'],
    ],
  ),
];

const doc = new Document({
  numbering: {
    config: [{
      reference: 'steps',
      levels: [{
        level: 0, format: 'decimal', text: '%1.', alignment: AlignmentType.START,
      }],
    }],
  },
  sections: [{ children }],
});

const buffer = await Packer.toBuffer(doc);
await writeFile('content/leadership-listing-guide.docx', buffer);
console.log('Wrote content/leadership-listing-guide.docx');
