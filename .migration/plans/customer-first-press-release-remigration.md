# Re-Migrate Customer First Press-Release Pages — 3-Section Structure + Related Stories

## Page count
**37 pages total** are in scope (the Customer First URLs you provided). Migration is phased:
- **Phase 1: 1 page** (interglobe) → single-page package → you verify.
- **Phase 2: remaining 36 pages** after your approval.

Each page's Related Stories section is included **only if the original source page has one**, so the final count of pages carrying a Section 3 depends on per-page extraction from the live site.

## Goal
Re-migrate each Customer First page so its JCR matches the attached sample, organized into 3 sibling sections:
- **Section 1** (`style=[no-top-spacing]`): Breadcrumb only
- **Section 2**: Article content — Article Header, hero Image, Column Control (body text + Social Share)
- **Section 3** (`style=[highlight]`): Title block ("Related Stories", h2, center, `showEyebrow=true`) + Related Articles (`mode=static`, 3 paths, `category` set) — **only if the source page has a Related Stories section**

Start with **one page** (interglobe), produce a **single-page** package scoped so it touches nothing else, and pause before the rest.

## Confirmed decisions (from you)
- **Related Stories source = the original site.** Fetch each source page; if it has a Related Stories section, read the 3 article card links and use their destination paths as static `path1/2/3`. If absent → omit Section 3.
- **Metadata strategy = existing rule, unchanged** (`image`, `publishdate`, `categorytitle`, `categoryurl` on `jcr:content`, same `modelFields` as today — matches sample).
- **Static paths use `us/en` delivery locale**: `/content/about-ups-eds/us/en/newsroom/press-releases/customer-first/<slug>`.
- **First page = interglobe**; single-page package only.

## Primary risk (validate first in execute mode)
`about.ups.com` returned **403** to a plain request from this environment earlier. Before building, confirm the source page is fetchable (browser User-Agent). Fallbacks if 403 persists:
- Reuse the fetch path/config the original import pipeline used (it reached the source during initial migration).
- If truly unreachable, pause and ask you to supply the 3 related links (or source HTML) for the page.

## Approach (execution-ready)
1. **Fetch source page** (interglobe) with a browser UA. Locate the Related Stories region (candidate selectors: `.upspr-headline` "Related Stories" heading + related card anchors, e.g. `.upspr-card`/content-tile). Extract up to 3 destination article URLs in order.
2. **Normalize** each URL → `/content/about-ups-eds/us/en/newsroom/press-releases/customer-first/<slug>` (strip host, `.html`, matching imported slugs). Set `showRelated = (count > 0)`.
3. **Rework `tools/importer/generate-article-jcr.mjs`** to emit 3 sibling sections under `root`:
   - `section_1` → `style=[no-top-spacing]`, child = breadcrumb (with `aueComponentId`)
   - `section` (article) → article-header, image, column-control (unchanged content/logic)
   - `section_related` → `style=[highlight]`, children = title-block ("Related Stories") + related-articles (static, path1–3, `articleCount=3`, `category`=customer-first content path) — **only when `showRelated`**
   - Every node keeps `aueComponentId`; models/modelFields mirror the sample.
4. **Single-page package:** `filter.xml` contains **only** the one leaf path (`.../customer-first/interglobe-enterprises-and-ups-launch-movin`) as a full-replace root — no parent nodes, no other leaves. Build zip under `migration-work/`, copy to a preview-served path for download.
5. **Pause for verification.** After approval, run the remaining 36 (per-page related-stories extraction; pages without the section get no Section 3).

## Files touched
- `tools/importer/generate-article-jcr.mjs` — 3-section output; conditional Section 3; related-stories extraction (or a small companion util for source fetch + link parse).
- New single-page package + download copy under `migration-work/` (and a `content/`-served copy for the link).

## Verification
- Diff generated leaf `.content.xml` vs the sample: section count/order, `no-top-spacing` / `highlight` styles, block models + `modelFields`, `aueComponentId`s, static paths (`us/en`), title-block `showEyebrow=true`.
- Confirm `filter.xml` lists only the single leaf path.
- Confirm related paths resolve on delivery (static cards read page meta).

## Checklist
- [ ] (Execute) Verify `about.ups.com` is fetchable with a browser UA; if 403, use the import pipeline's fetch or pause for the links
- [ ] Extract Related Stories links (≤3) from the interglobe source; normalize to `us/en` content paths; set `showRelated`
- [ ] Rework `generate-article-jcr.mjs` into 3 sections (breadcrumb / article / related); Section 3 conditional
- [ ] Keep existing metadata strategy unchanged
- [ ] Generate single-page package; scope `filter.xml` to only the interglobe leaf path
- [ ] Diff generated `.content.xml` against the sample; confirm no other paths in filter
- [ ] Copy zip to a preview path; provide the download link; **pause for approval**
- [ ] After approval: migrate the remaining 36 pages, extracting related stories per page (omit Section 3 where absent)

> Note: executing the source fetch, generator changes, and packaging requires **Execute mode** — currently in plan mode.
