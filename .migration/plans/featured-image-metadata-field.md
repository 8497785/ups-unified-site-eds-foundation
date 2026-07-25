# Add Featured Image Field to Page Metadata

## Goal
Let authors set a **Featured Image** in page properties. That value drives the page's `og:image` (and `image`) meta tag, which is what the query index and social/share previews already read.

## Scope decision (confirmed)
- **Direction:** Just add the page-metadata field. Page properties → `og:image` meta tag (single source).
- **Image component:** Leave the core image component (`core/franklin/components/image/v1/image`) untouched. **No** "use image from metadata" checkbox, no custom `image.js`.
- **Why the checkbox/two-way sync was dropped:** Edge Delivery / Universal Editor has no live binding between block content and page properties. A block can't auto-update a page property, and vice versa — so true two-way sync isn't achievable. A page-property field feeding `og:image` is the supported, reliable approach.

## Change

### `models/_page.json` — add one field to the `page-metadata` model
Append a Featured Image field after `keywords`. Uses the `reference` component (DAM asset picker), named `image` so delivery maps it to the `og:image` / `image` meta tags:

```json
{
  "component": "reference",
  "valueType": "string",
  "name": "image",
  "label": "Featured Image",
  "multi": false,
  "description": "Featured/social image for this page. Sets the og:image meta tag."
}
```

Then run `npm run build:json` to regenerate the merged `component-models.json` / `component-definition.json` / `component-filters.json`.

## Verification
- Confirm `image` appears in the regenerated `component-models.json` page-metadata model.
- Confirm no other model or query change is needed — `helix-query.yaml` already reads `image` from `head > meta[property="og:image"]`.
- Note the field name `image` is the AEM convention that renders the `og:image` meta tag; verify against a page in preview after authoring.

## Notes
- Existing migrated pages already emit `og:image` from their in-page **Metadata block** "Image" row; that continues to work. The new page-property field is the equivalent for pages authored without that block (e.g. `test-article`).
- No two-way sync: setting the block image won't populate this field and vice versa. This field is the page-property source for the social/featured image.
- Values refresh in the index only after the page + query index are **republished**.

## Checklist
- [ ] Add `image` (Featured Image, reference) field to `page-metadata` in `models/_page.json`
- [ ] Run `npm run build:json` to regenerate merged component JSON
- [ ] Verify `image` field present in regenerated `component-models.json`
- [ ] Confirm `helix-query.yaml` `image` selector needs no change (already reads og:image)
- [ ] Verify in preview that the Featured Image property renders as `og:image` on a test page
- [ ] Report back; note (re)publish required — no auto-commit

> Note: executing these edits and the build command requires **Execute mode** — currently in plan mode.
