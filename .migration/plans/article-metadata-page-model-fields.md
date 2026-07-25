Let me check the page-metadata model to plan adding these as authorable page properties.# Content-Authored Article Metadata via Page Properties (publishdate, category, category link)

## Your question answered: yes — adding them to the page model is the easiest, most robust path

Adding `publishdate` / `categorytitle` / `categoryurl` as fields on the **page-metadata model** is a good idea and simpler than reading block cells. Here's why it works cleanly:

- The core Franklin page component renders `jcr:content` page properties into **`<head>` meta tags** — exactly what the migrated pages already did (`publishdate`, `categorytitle`, `categoryurl` were written as page properties and appeared as head meta).
- The **query-index already reads those three from head meta** (`meta[name="publishdate"]`, etc.). So once an author fills the page properties, the meta renders and the index picks them up — **no query-index change, no fragile block-cell selectors.**
- "If value exists" is automatic: the page component only emits a meta tag for a property that has a value. Empty field → no meta → index column simply blank for that page. So it degrades gracefully.

This makes it fully author-driven: fill the fields in **Page Properties** (Universal Editor), publish, and the metadata + index populate.

> This is a plan only. Implementation requires **Execute mode.**

## The one trade-off to be honest about (duplication)

The **article-header block** already has authorable `eyebrow` (category title), `eyebrowLink` (category link), and `articleDate` cells — those drive the **on-page display**. If we also add `publishdate`/`categorytitle`/`categoryurl` to page metadata for the **index/SEO**, the author enters the category/date in **two places** (the block for display, page properties for the index).

Two ways to handle that, to confirm below:
- **A — Accept the small duplication:** block fields = on-page display; page-metadata fields = index/SEO source. Simplest, most robust, no block/JS risk. (This is the "add to page model" approach you're asking about.)
- **B — Single source via block cells:** don't add page-metadata fields; instead repoint the query-index to read the article-header **block cells** (no duplicate authoring, but selector-fragile and needs verification). This is the alternative from the prior plan.

## Current state (verified)

- `models/_page.json` (`page-metadata` model) currently has only `jcr:title`, `jcr:description`, `keywords`.
- Query-index (`helix-query.yaml`) reads `published` ← `meta[name="publishdate"]`, `category` ← `meta[name="categorytitle"]`, `categoryUrl` ← `meta[name="categoryurl"]` — already wired to head meta.
- Migrated pages already carry those meta tags (generator-written); manually-authored pages don't → the gap.

## Proposed change (Option A)

Add three fields to the `page-metadata` model in `models/_page.json`:
- `publishdate` — **date-time picker** (`component: date-time`, `valueType: date`, format `YYYY-MM-DD`), matching the article-header date field, so the stored/rendered value is clean and index-friendly.
- `categorytitle` — text.
- `categoryurl` — `aem-content` (content picker, `rootPath: /content/about-ups-eds`) so authors pick the category page and MSM rewrites it on rollout.

Then `npm run build:json`. No query-index or block change needed — the page component renders these to head meta, and the index already reads them.

## Open decisions to confirm at execution
- **A vs B** (page-metadata fields with minor duplication, vs. single-source block-cell reading).
- Whether the migrated pages' existing head meta (already present) is left as-is (it is — no conflict; page-properties fields just make the same values authorable/editable going forward).
- Exact field types above (date-time for publishdate, aem-content for categoryurl) — confirm.

## Risks / Notes
- **Duplication (Option A):** category/date authored in both the block and page properties. Acceptable for robustness; can be documented for authors.
- **Requires (re)publish:** head meta + index refresh only after publish; verify on `.aem.page`/`.aem.live`.
- **No regression:** migrated pages already have these meta tags; adding the model fields just exposes them as editable page properties — same values, now authorable on any page.
- **Verified-locally caveat:** model/build verifiable locally; head-meta emission + index population confirmed only after deploy + publish.

## Checklist

- [ ] Confirm approach: **A** (add publishdate/categorytitle/categoryurl to page-metadata model — recommended, easiest) vs **B** (repoint query-index to article-header block cells)
- [ ] Confirm field types: `publishdate` date-time picker, `categorytitle` text, `categoryurl` aem-content (rootPath /content/about-ups-eds)
- [ ] `models/_page.json`: add the three fields to the `page-metadata` model
- [ ] `npm run build:json`; verify merged model exposes the new page-metadata fields
- [ ] Lint / validate JSON build
- [ ] Confirm no query-index or block change is required (index already reads the head meta; page component renders properties → head meta)
- [ ] Verify on a published test page: fill the page properties → head meta appears → query-index row populates published/category/categoryUrl
- [ ] Confirm migrated pages still index correctly (existing meta unaffected)
- [ ] Document for authors: fill these in Page Properties for listing/SEO (article-header block still drives on-page display)
- [ ] Commit & push; note pages must be (re)published for meta + index to refresh — **Execute mode required**
