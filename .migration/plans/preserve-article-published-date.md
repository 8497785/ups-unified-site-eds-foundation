Let me verify what source data is available for the eyebrow link and metadata generation before finalizing feasibility.# Auto-Generated Page Metadata: Publish Date, Category Title, Category URL

## Objective

Add three page-metadata fields to every migrated press-release page, **fully auto-generated, no manual authoring**:

| Metadata key | Source | Format |
|---|---|---|
| **Publish Date** | article's `articleDate` if present, else fall back to the page's publish date | ISO 8601 (`2021-11-02`) |
| **Category Title** | the Eyebrow Title (e.g. `Customer First`) | plain text |
| **Category URL** | derived automatically from the **parent page path**, relative, `.html` stripped, rooted at `/us/en` or `/language-masters/en` per page location | relative URL |

**Feasibility: Yes — all three are possible and fully automatic.** All the source data already exists in the migrated content and the deterministic generator; nothing needs hand-authoring.

> Execution requires **Execute mode** — this plan is read-only until then.

## Feasibility Confirmation (verified in `generate-article-jcr.mjs`)

- **Publish Date** — the generator already parses `articleDate` (`:117`). It's present on all 39 pages. Fallback: when a page has no `articleDate`, use the page's publish date. ✅ Automatic.
- **Category Title** — the generator already parses `eyebrow` (`:111`, e.g. "Customer First"). ✅ Automatic.
- **Category URL** — computed from each page's own `REL_PATH` by dropping the last segment (the article slug) to get the parent, then presenting it relative with the correct locale root and no `.html`. The generator already knows every page's full path, so this needs no source data at all. ✅ Automatic. *(Per decision: derive from parent path, not the source eyebrow link.)*

**Per decisions:** Category URL derives from the **parent path**; Publish Date stored as **ISO 8601**.

## The Two-Layer Problem (why it's more than one edit)

The empty `eyebrow`/`articleDate` you saw in `query-index.json` proved a key fact: the **query-index crawler indexes server HTML and does not run block JS**, and it reads reliably from **`<head>` meta tags**. So to make these three values both (a) real page metadata and (b) usable by the index/SEO, they must land as **meta tags in `<head>`**, emitted from the JCR the generator produces.

Two coordinated layers:

### Layer 1 — Emit the metadata (generator → JCR → `<head>`)
Add a **Metadata / page-properties** section to each page so the pipeline renders these into `<head>` meta tags. In `generate-article-jcr.mjs`, compute and write:
- `publishdate` (or `published-time`) = ISO(`articleDate`) with publish-date fallback
- `category` (Category Title) = `eyebrow`
- `categoryurl` (Category URL) = parent-path-derived relative URL

Exact emission mechanism for this **AEM-sourced (xwalk)** site to confirm at execution: whether these go as `jcr:content` page properties that the boilerplate maps to meta, or as a metadata block/`head.html` mapping. The generator already holds all inputs, so wherever they need to be written, it can write them.

### Layer 2 — Surface in the query index (optional but recommended)
Repoint/extend `helix-query.yaml` `press-releases` to read these from the new meta tags (`head > meta[...]`), which also **fixes the current empty `eyebrow`/`articleDate`** (they were sourced from post-JS CSS classes that don't exist in server HTML).

## Category URL Derivation Logic (deterministic)

From each page's known path, e.g.
`/us/en/newsroom/press-releases/customer-first/ups-brown-friday`
→ drop the final slug segment → parent
`/us/en/newsroom/press-releases/customer-first`
→ ensure relative, strip any `.html`, keep the `/us/en` (or `/language-masters/en`) root as-is based on where the page lives.
Result: **`/us/en/newsroom/press-releases/customer-first`** (or the `language-masters` equivalent). Purely path math — no source dependency.

## Publish Date Logic

1. If `articleDate` present (MM-DD-YYYY) → parse → **ISO** (`2021-11-02`).
2. Else → fall back to the page's publish date (the pipeline/AEM publish timestamp), normalized to ISO.
3. Guard against unparseable/empty dates (skip rather than emit a bad value).

## Open Questions to Resolve at Execution

- **Meta emission mechanism** for AEM-sourced pages (page property → boilerplate meta mapping vs. metadata block vs. `head.html`) — the main implementation unknown.
- **Exact meta key names** the site/SEO expects (`publishdate` vs `published-time` vs `article:published_time`; `category`/`categoryurl` naming).
- **Publish-date fallback source** when `articleDate` is missing: is the AEM publish timestamp acceptable, or should such pages be flagged instead? (All 39 current pages have `articleDate`, so fallback is an edge case.)
- **Locale root detection** for `/us/en` vs `/language-masters/en`: the generator writes under `language-masters/en`; confirm the intended served root so Category URL matches the live URL space.

## Checklist

- [ ] Confirm the meta-emission mechanism for this AEM-sourced (xwalk) site (page property vs. metadata block vs. `head.html`)
- [ ] Confirm meta key names for Publish Date, Category Title, Category URL
- [ ] Implement date normalization `MM-DD-YYYY` → ISO `YYYY-MM-DD` in `generate-article-jcr.mjs`, with page-publish-date fallback when `articleDate` is absent
- [ ] Implement Category Title = `eyebrow` (already parsed) into page metadata
- [ ] Implement Category URL = parent-path-derived relative URL (strip slug + `.html`, keep `/us/en` or `/language-masters/en` root) into page metadata
- [ ] Wire all three into the JCR so they render as `<head>` meta tags on delivery (no manual authoring)
- [ ] (Recommended) Repoint `helix-query.yaml` `press-releases` fields to read from the new meta tags — fixes the current empty `eyebrow`/`articleDate` and adds `published`/`category`/`categoryurl`
- [ ] Regenerate the package for all 39 pages; verify each `.content.xml` carries the three metadata values, correctly derived
- [ ] (Re)publish a sample `us/en` page; confirm the meta tags render in server HTML and the `query-index.json` row shows populated `published` (ISO), category, category URL
- [ ] Backfill: repackage + (re)publish all 39 pages; confirm chronological sort and category grouping work in the listing consumer
- [ ] Commit & push the focused changes (`generate-article-jcr.mjs` + `helix-query.yaml`) — **Execute mode required**
