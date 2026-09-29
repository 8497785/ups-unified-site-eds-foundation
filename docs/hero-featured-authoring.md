# Hero Featured — Authoring Guide

The Hero Featured block shows a large background image with a white content
card on top of it. The card holds an **eyebrow** (small uppercase label with a
gold accent line), a **title**, a short **description** and a gold **CTA
button** (e.g. "Read The Statement").

## Adding the block

1. Open the page in the Universal Editor.
2. In the section (or column) where you want the hero, click the **+** (Insert)
   control and choose **Hero Featured**.
3. Select the block and fill in its fields in the properties panel.

## Fields

- **Image** — the background image. Pick it from Assets.
- **Alt** — a short description of the image for screen readers.
- **Text** — the card's **title** and **description**. Write the title as a
  heading and the description as a paragraph below it. Don't add the eyebrow or
  the button here — they have their own fields below.
- **Eyebrow** — how the eyebrow is filled:
  - **Dynamic (parent page of Link)** (default) — the eyebrow shows the name of
    the **parent page** of the page picked in **Link**, and links to it. For
    example, if Link is `…/newsroom/negotiations/faq`, the eyebrow shows
    "Negotiations" and links to `…/newsroom/negotiations`.
  - **Static (authored)** — you type the eyebrow text and pick its link yourself
    (two extra fields appear, see below).
  - **None (no eyebrow)** — no eyebrow is shown.
- **Eyebrow text** *(only with Static)* — the eyebrow label (e.g.
  "2023 LABOR NEGOTIATIONS"). Leave it blank to show the name of the Eyebrow
  link page.
- **Eyebrow link** *(only with Static)* — the page the eyebrow links to. Leave it
  blank to link to the parent page of **Link**.
- **Link** — the page the CTA button links to. With a Dynamic eyebrow, this is
  also where the eyebrow gets its parent page from.
- **CTA text** — the button label (e.g. "Read more", "Read The Statement").
- **Presentation** — optional layout choices (see below).

## The CTA button

The button is shown only when **both Link and CTA text** are filled in. There is
no default label — if CTA text is empty, no button appears. This keeps
translated pages from showing an untranslated "Read more", so always fill in CTA
text (and have it translated) when you want a button.

## Eyebrow text and translations

Page names used by a Dynamic eyebrow (or a blank Static eyebrow text) come from
the linked page's **title**, so they follow the page's translation
automatically. Static eyebrow text is typed by you and needs translating like
any other field.

## Presentation (layout)

- **Rounded corners** — rounds the hero's corners. Without it, the corners are
  square.
- **Align card left** — the card sits on the left (this is also the default).
- **Align card right** — the card moves to the right. The text inside the card
  stays left-aligned.

The hero is as wide as the page's normal content area, lining up with the
other blocks on the page. The card always sits at the bottom of the image.

- **Desktop (≥ 992px):** the hero is at least 520px tall and the card is up to
  440px wide.
- **Tablet and mobile (< 992px):** the hero is at least 450px tall and the card
  is up to 420px wide.

## Heroes created before these fields existed

Older heroes have the eyebrow and "Read more" typed inside the **Text** field.
Their content keeps displaying as before. Their corners are now square and they
line up with the page's content width; tick **Rounded corners** to get the
previous rounded look. When you move such a hero to the new fields:

- Filling in **Link** and **CTA text** replaces the old button typed in Text.
- A Dynamic eyebrow (with Link filled in) or a Static eyebrow (with Eyebrow text
  or Eyebrow link filled in) replaces the old eyebrow typed in Text.
- Eyebrow **None** hides the old eyebrow.

Then **delete the old eyebrow and button from Text**, otherwise they reappear if
the new fields are cleared again.

## Quick recipes

| Goal | Steps |
|------|-------|
| Story hero with eyebrow from the section page | Eyebrow: **Dynamic**. Link: the story page. CTA text: e.g. "Read more". |
| Hero with a custom eyebrow | Eyebrow: **Static**. Eyebrow text: your label. Eyebrow link: the page it should open. Fill Link + CTA text for the button. |
| Hero with no eyebrow | Eyebrow: **None**. Fill Link + CTA text for the button. |
| Hero with no button | Leave **CTA text** empty (Link can stay filled if a Dynamic eyebrow needs it). |
| Card on the right, rounded corners | Presentation: **Rounded corners** + **Align card right**. |
