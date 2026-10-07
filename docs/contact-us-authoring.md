# Contact Us — Authoring Guide

The Contact Us block shows a white card with a **title** across the top and two
parts side by side: a **left card** (e.g. "For Reporters and Media Outlets"
with phone, email and X contacts) and a **right card** (e.g. "Additional
Information" with links). It is used for the "Media Resources" section on the
Negotiations page.

## Adding the block

1. Open the page in the Universal Editor.
2. In the section where you want the card, click the **+** (Insert) control and
   choose **Contact Us**.
3. Select the block and fill in its fields in the properties panel, or click
   into the title and the two cards on the page to edit them directly.

## Fields

| Field | Description |
| --- | --- |
| **Title** | Heading across the top of the card, e.g. "Media Resources". |
| **Left card** | Rich text for the left part: a heading, paragraphs and a contact list. |
| **Right card** | Rich text for the right part, e.g. "Additional Information" with links. |
| **Presentation** | **Full width** stretches the card across the whole content width. Leave it off for the default: a centred card, 10 of 12 columns wide. |

## Writing the cards

- **Headings** — use a heading (e.g. Heading 4) for each part's label. It is
  shown in small grey capitals, e.g. "FOR REPORTERS AND MEDIA OUTLETS".
- **Text** — normal paragraphs.
- **Links** — shown bold, underlined and blue. A link on its own line (e.g.
  "Media library") stays a plain link; it does not turn into a button.

## Contact list icons

In a bulleted list, each item that contains one of these links gets its icon
automatically — you don't add icons yourself:

| Link in the list item | Icon |
| --- | --- |
| Phone number, e.g. `tel:1-404-828-7123` | Phone |
| Email address, e.g. `mailto:pr@ups.com` | Mail |
| X / Twitter page, e.g. `https://x.com/ups_news` or `https://twitter.com/ups_news` | X logo |

To create these links, select the text (e.g. "1-404-828-7123"), add a link and
enter the `tel:` or `mailto:` address, or the X profile URL. Extra text around
the link is fine — e.g. "**Follow** @UPS_News **for the latest company news**".

List items without such a link are shown as a plain list: no bullets in the
left card, grey bullets in the right card.

## Layout

- **Desktop (≥ 992px):** the left card takes about 7/12 of the width and the
  right card 5/12, with a light grey vertical line between them.
- **Tablet and mobile (< 992px):** the two parts stack, with a light grey line
  between them, and the card padding is smaller.
- **Full width:** same layout, but the card spans the whole content width.

## Empty parts

If you leave **Left card** or **Right card** empty, that part is left out on the
published page and the other part spans the card (no divider). In the editor
the empty part stays visible so you can still click into it and add content.

## Troubleshooting

| Problem | What to do |
| --- | --- |
| A contact item has no icon | The item must contain a link to a `tel:` number, a `mailto:` address or an x.com / twitter.com page. |
| A part is missing on the published page | It is empty — add content to **Left card** or **Right card**. |
| A link looks like a button | Links inside this block always show as plain links; if you see a button, the content is probably in a different block. |

## Quick recipes

| Goal | Steps |
| --- | --- |
| Media Resources card (as on Negotiations) | Title "Media Resources". Left card: heading "For Reporters and Media Outlets", two paragraphs, a list with the phone, email and "Follow @UPS_News…" links. Right card: heading "Additional Information" and a "Media library" link. |
| Card across the whole width | Presentation: **Full width**. |
| Single-part card | Fill in **Left card** only and leave **Right card** empty. |
