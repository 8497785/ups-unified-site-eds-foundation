# Article Page Migration — Update Column Control to Current Model

## Objective

Finish the UPS press-release page migration so the **uploaded AEM page looks exactly like the local preview**. Article-header, hero, body, and social-share already render correctly in preview; the only stale piece is the **Column Control** node in the JCR package (old `grid-layout-container` model). Regenerate the JCR from current content via the pipeline, rebuild the package, and verify the packaged output matches the preview.

- **Page:** `https://about.ups.com/us/en/newsroom/press-releases/customer-first/ups-extends-complex-healthcare-logistics-lead-with--48-million-i.html`
- **Target JCR path:** `/content/language-masters/en/newsroom/press-releases/customer-first/ups-extends-complex-healthcare-logistics-lead-with-48-million-i`
- **Definition of done:** packaged page, once uploaded, renders identical to local preview — 8/4 layout, body left, social-share right, correct header/hero/spacing, relative image path.
- **Constraint (per user):** the pipeline must produce the correct two-column JCR **on its own — no hand-authoring**. Any collapse is fixed in the parser/transformer, never by editing generated XML.

> **Execution requires Execute mode.** The user has approved proceeding; switch to Execute mode to run the checklist below (Plan mode is read-only).

## Current State (verified)

- **Preview is source of truth** — `content/language-masters/.../…48-million-i.plain.html` renders `class="column-control layout-8-4"`, body in col1, social-share in col2, absolute image URL.
- **Importer parser** already emits `Column Control (layout-8-4)`. ✓
- **JCR package `.content.xml` is STALE** — old model: `model="grid-layout-container"`, `name="Grid Layout Container"`, `classes="cols-8-4"`; `col1`/`col2` carry `model="grid-column"` + `width-8`/`width-4`. Upload would NOT match preview.
- **Current Column Control model:** `columns/v1/columns`, model `column-control`, filter `column-control`, fields `columns` + `classes` (layout-*); native `column` children (no per-column model / width classes).

## Target JCR Shape (pipeline must produce automatically)

```
<block_1 columns/v1/columns  rows="1" columns="2"
         model="column-control" name="Column Control" classes="layout-8-4">
  <row1>
    <col1>  → text block (full body rich text)
    <col2>  → social-share block
  </row1>
</block_1>
```
- Native `col1`/`col2` (no `grid-column` model, no `width-*` classes — `layout-8-4` drives widths).
- Image `image="/content/dam/upsstories/..."` (relative, no `about-ups-eds`).

## Known Risk & Resolution (no hand-authoring)

The md→JCR converter has previously collapsed a columns cell containing a nested block (social-share in col2). If it recurs, fix it **in the pipeline** so regeneration is repeatable:
1. Fix the parser (`tools/importer/parsers/article.js`) so the emitted structure round-trips through md→JCR with both columns intact.
2. Fix/add a transformer if the collapse happens during JCR generation.
3. Re-run import + regenerate + re-verify. Hand-editing generated XML is out of scope.

## Checklist

### Phase 1 — Re-import (preview-matching content)
- [ ] Re-bundle `tools/importer/import-article.js` if the bundle is out of date
- [ ] Run the bulk import for the article URL; confirm it saves to `language-masters/en/.../…48-million-i`
- [ ] Verify regenerated `.plain.html`: `column-control layout-8-4`, body in col1, social-share in col2, image absolute `https://about.ups.com/content/dam/...`
- [ ] Load in local preview; confirm it visually matches the intended look (8/4, header, hero, spacing, social icons)

### Phase 2 — Regenerate JCR (pipeline-driven)
- [ ] Regenerate `.content.xml` from imported content using current component models
- [ ] Confirm column block: `columns/v1/columns`, `model="column-control"`, `name="Column Control"`, `classes="layout-8-4"`, `rows="1" columns="2"`
- [ ] Confirm `col1`/`col2` are native cells (no `grid-column` model, no `width-*` classes)
- [ ] Confirm image path relative `/content/dam/upsstories/...` (pipeline strips host + any `about-ups-eds`)

### Phase 3 — Blocking verification (columns must survive, pipeline-only)
- [ ] **col1 populated** with full body rich text (ATLANTA… paragraphs + bullet list)
- [ ] **col2 populated** with the social-share block node
- [ ] If either column collapsed → fix the parser/transformer (not the XML), re-run import + regenerate, re-verify
- [ ] `.content.xml` is well-formed XML

### Phase 4 — Rebuild package
- [ ] Rebuild `migration-work/packages/about-ups-eds.zip` from the regenerated `jcr_root` tree
- [ ] Confirm `asset-mapping.json` / manifest image targets are `/content/dam/upsstories/...` (no `about-ups-eds`)
- [ ] Verify zip: article `.content.xml` present, `column-control`/`layout-8-4`, col1+col2 populated, relative image path

### Phase 5 — Handoff
- [ ] Report verified package location + exact column-control JCR shape; confirm it will render like the preview
- [ ] User uploads the package (upload not in scope for this run)
- [ ] Do not commit unless explicitly asked

## Notes / Assumptions
- Goal: **uploaded page must look like the local preview**, and the **pipeline must generate the correct JCR without hand-authoring**.
- Approach = re-import + regenerate JCR; scope = update + rebuild zip + verify (user uploads).
- Reused as-is: article-header, hero image, social-share (already correct in preview).
- Column Control block code is already deployed/correct; this task refreshes the article's JCR via the pipeline so upload matches preview.
- If the nested-block collapse recurs, resolve with a parser/transformer fix (repeatable for any similar page), not a one-off manual edit.
