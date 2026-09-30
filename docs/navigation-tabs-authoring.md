# Navigation Tabs — Authoring Guide

The Navigation Tabs block shows a row of links for navigating between related
pages. Each tab is a white card with the page name, a gold line along the
bottom and a blue circled arrow (e.g. "Industry overview" on the Negotiations
page).

## Adding the block

1. Open the page in the Universal Editor.
2. In the section where you want the tabs, click the **+** (Insert) control and
   choose **Navigation Tabs**.
3. Select the block and choose a **Tabs source** in the properties panel.

## Tabs source

- **Static** (default) — you add each tab yourself (see below).
- **Dynamic** — the block creates one tab for each page directly below a page
  you choose (see below).

## Static tabs

1. Select the **Navigation Tabs** block (on the page or in the content tree).
2. Click **+** (Add) on the block. A new **Navigation Tab** is added straight
   away — there is no menu, because it is the only item the block accepts.
   In the editor it appears as a dashed placeholder reading
   "New tab: add a label and link".
3. Select the new tab and fill in its fields:

| Field | Description |
| --- | --- |
| **Navigation Label** | Text shown on the tab. Required; up to 24 characters. |
| **Navigation Links** | The page the tab opens. Required; pick a page below `/content/about-ups-eds`. |
| **Open in New Window** | Opens the page in a new browser tab when switched on. |

4. Repeat **+** for each tab. Reorder or delete tabs in the content tree.

A tab missing its label or link stays a dashed placeholder in the editor and is
**not shown** on the published page.

## Dynamic tabs

1. Set **Tabs source** to **Dynamic**. The **Navigation Root** field appears.
2. Pick the **Navigation Root** page (below `/content/about-ups-eds`).

The block creates one tab for each page **directly** below that root — pages
further down are not included. Tabs always open in the same window. Any Static
tabs left on the block are ignored while Dynamic is selected.

**Tab labels and order:**

- **In the Universal Editor** the tabs are read from AEM, in the same order as
  the pages in AEM. The label is the page's **Page Title** (SEO title) if set,
  otherwise its **Navigation Title**, otherwise its **Title**, otherwise the page
  name.
- **On the preview and live site** the tabs are read from the site's page index.
  The label is the page's title (without a trailing " | About UPS"), otherwise
  the page name. The order follows the page index.

**Only published pages appear on the site.** The page index only contains pages
published to the site (`/content/about-ups-eds/us/en/…`). A root elsewhere —
for example under `language-masters` — shows its tabs in the editor, but no
tabs on the preview or live site. Pages rolled out from a language master to
`/us/en` normally get their Navigation Root updated to the live copy.

## Layout

- **Desktop (≥ 992px):** up to three 360px tabs per row, centred. More tabs wrap
  to a new, centred row.
- **Tablet and mobile (< 992px):** tabs stack full width.
- On hover (or keyboard focus) the arrow slides slightly to the right.

## Example

A Dynamic block with Navigation Root `/content/about-ups-eds/us/en/newsroom`
creates the tabs **Press Releases**, **Statements** and **Negotiations** — one
for each page directly below Newsroom.

## Troubleshooting

| Problem | What to do |
| --- | --- |
| Clicking **+** seems to do nothing | The new tab is added as a dashed placeholder; if you still don't see it, check the content tree under the block. If the block was inserted a while ago and **+** offers nothing at all, delete it and insert a new Navigation Tabs block. |
| A tab doesn't show on the published page | Fill in both **Navigation Label** and **Navigation Links**. |
| Dynamic shows no tabs on the site | Check that the Navigation Root is a published page under `/us/en` and that it has child pages. |

## Quick recipes

| Goal | Steps |
| --- | --- |
| One tab to a related page | Tabs source: **Static**. **+** → Navigation Tab: label "Industry overview", link the page. |
| Tabs for every section page | Tabs source: **Dynamic**. Navigation Root: the parent page. |
| Tab that opens in a new window | Static tab with **Open in New Window** on. |
| Change the tab order | Static: drag the tabs in the content tree. Dynamic: reorder the pages in AEM (editor) — the site follows the page index. |
