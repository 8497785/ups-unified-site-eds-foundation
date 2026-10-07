# Awards CF List — Authoring Guide

The Awards CF List shows a list of awards and recognitions, the same as on the
**Newsroom → Awards and Recognition** page. The awards themselves are **Content
Fragments** in AEM Assets. The block only points at a year folder and lists every
award in it, newest first. To change an award's text, edit its Content Fragment,
not the page.

## Adding the block

1. Open the page in the Universal Editor.
2. In the section where you want the list, click the **+** (Insert) control
   and choose **Awards CF List**.
3. Select the block, open the properties panel, and pick the **Awards Folder**.

## Field

- **Awards Folder**: pick a year folder (e.g. **2026**) to list that year's
  awards. The picker opens at `/content/dam/upsstories/awards` and only lets you
  choose folders inside it.

Until a folder is picked, the block shows a grey placeholder with
"Select an awards folder to see the list." in the editor, and nothing on the
published page.

## What each award shows

Each item in the list comes from one award Content Fragment:

| On the page | Content Fragment field |
|-------------|------------------------|
| Small uppercase label with a gold line | **Eyebrow** (links to the **Eyebrow Link** page, if one is set) |
| Heading | **Title** |
| Date, shown as MM-DD-YYYY | **Award Date** |
| Text after the date | **Description** |
| **Read More ›** link | **CTA Link** (no link means no Read More) |
| Read More opens in a new tab | **Link Action** checked; unchecked opens in the same tab |

Awards are sorted by **Award Date**, newest first.

The Content Fragment editor may label these fields slightly differently. They
are the eyebrow, eyebrowLink, title, awardDate, description, ctaLink and
linkAction fields of the award model.

## Adding or changing awards

1. In **Assets → Files**, go to `/content/dam/upsstories/awards/<year>/`.
2. Create a Content Fragment with the award model, or edit an existing one, and
   fill in the fields above.
3. **Publish** the Content Fragment. The published site only lists published
   awards. In the editor, reload the page to see changes.

For a new year, create the year folder (e.g. `2027`) under `awards` first, then
add the award fragments to it.

## Layout

- **Desktop (≥ 1024px):** a single column, 77% of the page width, centered.
- **Tablet and mobile (< 1024px):** full width.
- Awards are separated by a thin grey line.

## Messages you may see in the editor

| Message | Meaning |
|---------|---------|
| Select an awards folder to see the list. | No folder picked yet. |
| No awards found in /content/dam/upsstories/awards/2026/ | The folder has no award fragments (or they can't be read). On the published page the block is hidden. |

## Quick recipes

| Goal | Steps |
|------|-------|
| One list per year | For each year add a **Title** block (e.g. "2026"), then an **Awards CF List** with that year's folder. |
| Add a new award | Create the award Content Fragment in its year folder, fill the fields, publish it. The list updates on its own. |
| Read More in a new tab | In the award's Content Fragment, check **Link Action**. |
| Hide Read More | Leave the award's **CTA Link** empty. |
