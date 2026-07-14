Let me inspect the intermediate parent-page nodes in the package to understand their current state.Confirmed — the intermediate parent pages (`newsroom`, `press-releases`, `customer-first`, `en`, `language-masters`) all have **empty `jcr:content`** with no `jcr:title`. Only the leaf article page has a title (currently "Article"). In AEM these parents will appear untitled.

Let me confirm the exact source-site titles so the plan pins down what each parent should be named. Let me check the manifest/paths for the source URL structure.I have what I need to understand the gap. The intermediate parent pages have empty titles. Two things need clarifying to build the right plan.# Add Titles to Article Parent Pages (and Fix Leaf Title)

## Objective

When the article page was migrated to `/content/language-masters/en/newsroom/press-releases/customer-first/…`, the intermediate **parent pages were created as empty, untitled nodes**. After upload they appear in AEM without titles. Set a proper `jcr:title` on every parent page (fetched from the original site) and fix the leaf article's title so the whole branch reads correctly in AEM.

- **Package:** `migration-work/packages/about-ups-eds.zip` (JCR root at `migration-work/packages/jcr/jcr_root`)
- **Definition of done:** every page node from `language-masters` down to the article leaf carries a meaningful `jcr:title`; package rebuilt and verified; user re-uploads.

> Execution requires **Execute mode.** This plan is read-only until then.

## Current State (verified)

- Intermediate parent `.content.xml` files exist but their `<jcr:content>` is **empty — no `jcr:title`**:
  - `language-masters/.content.xml`
  - `language-masters/en/.content.xml`
  - `language-masters/en/newsroom/.content.xml`
  - `language-masters/en/newsroom/press-releases/.content.xml`
  - `language-masters/en/newsroom/press-releases/customer-first/.content.xml`
- The **leaf** article page has `jcr:title="Article"` (a placeholder, not the real headline).
- Source base URL: `https://about.ups.com`; source pages live under the `/us/en/` locale (e.g. `/us/en/newsroom.html`).

## Title Source (per user: fetch from original site)

Fetch each parent's real page title from about.ups.com and use its `<title>`/H1. Map JCR parent → source URL:

| JCR parent node | Source URL to fetch | Expected title (verify) |
|---|---|---|
| `en` (locale root) | — (structural) | "English" or site/home title |
| `language-masters` | — (structural) | structural (see decision note) |
| `newsroom` | `https://about.ups.com/us/en/newsroom.html` | Newsroom |
| `press-releases` | `https://about.ups.com/us/en/newsroom/press-releases.html` | Press Releases |
| `customer-first` | `https://about.ups.com/us/en/newsroom/press-releases/customer-first.html` | Customer First |
| leaf article | `…/ups-extends-complex-healthcare-logistics-lead-with--48-million-i.html` | real article H1/title (replace "Article") |

- **Fetch method:** the local dev server / WebFetch is blocked for about.ups.com (403 seen previously). Use the **headless-browser path** (same mechanism the bulk importer uses) to read each parent page's `<title>`; fall back to the page H1 if `<title>` is site-suffixed.
- **`language-masters` and `en`** have no real source page. Since the user chose "all parents," give them sensible structural titles (`en` → "English"; `language-masters` → "Language Masters") unless a fetched value is clearly better. Flag this in the report.

## Approach (no hand-authoring of generated XML beyond title attributes)

Titles are a single `jcr:title` attribute per parent `<jcr:content>`. Two options for setting them, decided at execution:
1. **Extend the JCR generator** (`tools/importer/generate-article-jcr.mjs`) to also write parent `.content.xml` files with fetched titles — repeatable, preferred.
2. If a generator change is overkill for structural parents, set the `jcr:title` attribute on each parent `.content.xml` programmatically (scripted, not manual) using the fetched titles.

Either way the result is repeatable and driven by fetched data, not ad-hoc edits.

## Checklist

### Phase 1 — Gather source titles
- [ ] Fetch `<title>`/H1 for `newsroom`, `press-releases`, `customer-first` from their about.ups.com URLs (headless browser; strip any " | UPS" site suffix)
- [ ] Confirm the real leaf article title/headline (replace placeholder "Article")
- [ ] Decide `en` / `language-masters` structural titles (English / Language Masters) — record in report

### Phase 2 — Apply titles to the package JCR
- [ ] Set `jcr:title` on each parent `.content.xml` (`newsroom`, `press-releases`, `customer-first`, plus `en`, `language-masters`)
- [ ] Update the leaf article `jcr:title` from "Article" to the real headline
- [ ] Keep each `<jcr:content>` otherwise intact (resourceType, template); only add/set `jcr:title`
- [ ] Prefer doing this via the generator/script so it's repeatable

### Phase 3 — Verify
- [ ] Every parent + leaf `.content.xml` is well-formed XML
- [ ] Each node has a non-empty `jcr:title`
- [ ] Leaf article still has correct Column Control (`column-control`/`layout-8-4`, col1 body + col2 social-share), relative image path (no regressions from prior fix)

### Phase 4 — Rebuild package
- [ ] Rebuild `migration-work/packages/about-ups-eds.zip` from the updated `jcr_root`
- [ ] Verify zip contains all parent + leaf `.content.xml` with titles
- [ ] Confirm `column` component definition still present in `component-*.json` (upload-validation fix from prior step)

### Phase 5 — Handoff
- [ ] Report the title set on each node + package location
- [ ] User re-uploads via the UI; after upload the parent pages show titles in AEM
- [ ] Do not commit unless explicitly asked

## Notes / Assumptions
- Per user: titles **fetched from the original site**, and set on **all parents + the leaf**.
- Source pages are under `/us/en/…`; the JCR path drops the locale to `language-masters/en/…`, so parent→source mapping strips `us/` and appends `.html`.
- `en` / `language-masters` have no direct source page → structural titles, flagged for the user.
- No other page content changes; this only adds `jcr:title`. The earlier Column Control / `column`-definition / image-path fixes remain intact and are re-verified in Phase 3–4.
- If about.ups.com blocks headless fetch for a parent, fall back to the URL-segment title-case for that node and note it.
