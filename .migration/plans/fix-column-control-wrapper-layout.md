# Article Page Migration Plan (with Grid Layout Container Block)

## Objective

Migrate the UPS press-release page to AEM Edge Delivery Services (xwalk / Universal Editor), building a reusable **Grid Layout Container** block that provides the 8/4 body layout the article needs. The block is generic and reusable beyond this page. **The 8/4 layout with a nested block in the right column is a hard requirement — no fallback.**

- **Source:** `https://about.ups.com/us/en/newsroom/press-releases/customer-first/ups-extends-complex-healthcare-logistics-lead-with--48-million-i.html`
- **Target JCR path:** `/content/language-masters/en/newsroom/press-releases/customer-first/ups-extends-complex-healthcare-logistics-lead-with--48-million-i` (locale `/us/en/` stripped, rest preserved)
- **Project:** xwalk, site `about-ups-eds`, base URL `https://about.ups.com`

> Execution requires **Execute mode** — this plan is read-only until then.

## Confirmed Scope Decisions

- **Layout vehicle:** the article's 8/4 body region is built with the new **Grid Layout Container** block (Grid Column width 8 = body, width 4 = social-share/downloads). Replaces the old `column-control`.
- **8/4 is mandatory, no fallback:** the two-column 8/4 layout with the social-share *block* nested in the width-4 column must render correctly and must survive packaging/upload intact. The full-width-body fallback is removed from scope.
- **Packaging approach (decisive):** because the md→JCR converter collapses a columns cell that contains a block, the JCR for this page will be produced/uploaded so both columns are preserved — the authored JCR is the source of truth for upload, and the packaging step must not regenerate it into a collapsed single column. Verification that `col1`+`col2` are both populated is a blocking gate, not a branch point.
- **Grid child management:** author picks column count for layout intent, then adds that many **Grid Column** children manually via the container filter (auto-spawn isn't expressible in model JSON).
- **Width validation:** widths default to **Auto** (equal distribution); custom widths are normalized + `console.warn` at render time (no live editor cross-child validation).
- **Grid CSS:** emit `row` / `col-lg-*` class names but style with the block's **own self-contained CSS** — no external Bootstrap dependency.
- **Article blocks:** rebuild the full set — article-header, social-share, downloads.

## Part A — Grid Layout Container Block

### Grid Layout Container (container)
- **resourceType:** `core/franklin/components/columns/v1/columns`.
- **Field:** `columns` select `1|2|3|4`, default `1`.
- **Filter:** allows only **Grid Column**.
- **Render:** wrapper gets `class="row"`; JS assigns each child a `col-lg-*` class.

### Grid Column (child)
- **resourceType:** `core/franklin/components/columns/v1/column` (needs both `model` + `filter`).
- **Field:** `width` select `Auto | 1…12`, default `Auto`.
- **Filter:** allows any EDS block + default content — pure layout wrapper; only usable inside Grid Layout Container.

### Width resolution (render-time JS)
- All Auto → equal split (1→12, 2→6·6, 3→4·4·4, 4→3·3·3·3).
- Explicit widths used as-is (`4+8` → `col-lg-4 col-lg-8`).
- Mixed → explicit kept, remainder split across Auto columns.
- Sum ≠ 12 → normalize + `console.warn("Total column width must equal 12. Current total: N")`.

### Responsive (self-contained CSS)
- Desktop ≥992px: configured `col-lg-*` on 12-grid. Tablet: ~2 per row. Mobile: full-width stack. Structured for future tablet/mobile width fields.

## Part B — Article Page

### Source block inventory (confirm during analysis)
| Region | Source markup | EDS target |
|---|---|---|
| Eyebrow + link | `.upspr-two-column_eyebrow` | article-header (eyebrow, eyebrowLink) |
| Title H1 | `.upspr-two-column_title h1` | article-header (title) |
| Date / read time | `.upspr-byline .upspr-story-date` | article-header (articleDate, hideReadTime) |
| Description | `.upspr-two-column_subtext` | article-header (description) |
| Hero image | `.upspr-heroimage img` | default content `<picture>` |
| Body rich text | `.cmp-text` | Grid Column (width 8) rich text |
| Social share | share icons | social-share block → Grid Column (width 4) |
| Downloads (if any) | asset links | downloads block → Grid Column (width 4) |
| Related Stories | outside `div.upspr-two-column` | excluded |

### Article blocks to rebuild
- **article-header** — eyebrow, eyebrowLink, title (richtext H1), description (richtext), articleDate, hideReadTime.
- **social-share** — JS-generated icons (uses repo `upspricons` font).
- **downloads** — asset list (wired only if source has downloadable assets).

## Files to Create / Update
- `blocks/grid-layout-container/_grid-layout-container.json`, `grid-layout-container.js`, `grid-layout-container.css`
- `blocks/article-header/…`, `blocks/social-share/…`, `blocks/downloads/…`
- `models/_section.json` — allow `grid-layout-container` (+ article-header, downloads) at section level
- `tools/importer/page-templates.json` — article template entry + URL
- Article parser + transformer under `tools/importer/`
- Regenerate merged JSON (`npm run build:json`)

## Checklist

### Phase 1 — Grid Layout Container block
- [ ] Create `_grid-layout-container.json` (container + Grid Column defs/models/filters)
- [ ] Container `columns` select (1–4, default 1); child `width` select (Auto,1–12, default Auto); no field hints
- [ ] `grid-layout-container.js`: add `row`, compute `col-lg-*` (Auto/explicit/mixed), normalize+warn, load nested blocks
- [ ] `grid-layout-container.css`: self-contained responsive grid (desktop/tablet/mobile)
- [ ] Add `grid-layout-container` to `models/_section.json` filter; `npm run build:json`
- [ ] Preview test: 1/2/3/4 all-Auto, `4+8`, `3+6+3`, `2+4+4+2`; nested block renders; invalid-sum warns

### Phase 2 — Article analysis
- [ ] Scrape source; capture cleaned HTML, screenshots, metadata
- [ ] Confirm block inventory vs real DOM (esp. whether Downloads assets exist)
- [ ] Identify sections / default-content vs block regions

### Phase 3 — Article blocks
- [ ] Build article-header (model, JS, CSS)
- [ ] Build social-share (verify `upspricons` glyphs render)
- [ ] Build downloads (only if source has assets); `npm run build:json`

### Phase 4 — Import infrastructure
- [ ] Add article template + URL to `page-templates.json`
- [ ] Parser emits: article-header, hero image, Grid Layout Container (2 cols) with body (width 8) + social-share block (width 4)
- [ ] Output path under `/content/language-masters/en/...`
- [ ] Image handling: absolute `https://about.ups.com/content/dam/...` in preview, relative `/content/dam/...` on package
- [ ] Bundle importer; run bulk import for the single URL

### Phase 5 — Preview verification
- [ ] Verify render: header, hero image loads, full body, social icons, and the 8/4 two-column layout
- [ ] Validate field hinting against each block model

### Phase 6 — Packaging & upload (blocking gate — 8/4 must survive)
- [ ] Produce the JCR for the target path with the Grid Layout Container as `columns/v1/columns`, `rows="1" columns="2"`, `col1` = body (width 8), `col2` = social-share block (width 4)
- [ ] **Ensure packaging does not regenerate/collapse the columns** — upload the authored JCR as the source of truth (bypass any md→JCR regeneration that would drop the nested block); the authored `.content.xml` must be what lands in AEM
- [ ] **Blocking verification:** confirm both `col1` (body) and `col2` (social-share) are populated in the packaged `.content.xml` — if collapsed, fix the packaging step and re-verify; do NOT ship a single-column result
- [ ] Confirm image path `/content/dam/...` (no `about-ups-eds` prefix) in final package
- [ ] Upload; confirm in Universal Editor that both columns and all content are present and authorable, and that Preview/Publish renders 8/4

### Phase 7 — Wrap-up
- [ ] Report target path, blocks created, authoring steps (pick count → add N Grid Columns), known limitations
- [ ] Do not commit unless you explicitly ask

## Notes / Known Limitations
- **8/4 nested-block requirement (no fallback):** the social-share block sits in the width-4 Grid Column and must render and package correctly. The known md→JCR collapse behavior is handled by treating the authored JCR as the upload source of truth and gating on `col1`+`col2` both being populated — there is no full-width fallback.
- **No auto child sync / no live editor validation:** documented; Auto default keeps layouts valid by construction.
- **Bootstrap classes are cosmetic hooks:** styling comes from the block's own CSS; no external Bootstrap needed.
- **Path root:** the new page lives under `/content/language-masters/en/...`, different from the current `paths.json` root (`/content/about-ups-eds/us/en/`). Execution will flag whether a `paths.json`/fstab mapping is needed for local preview.
- Names per spec: **Grid Layout Container** (not Columns/Section/Container/Layout/Row) with **Grid Column** child.
