# Dynamic Article Hero + Article Listing — Index Strategy

## Recommendation (given you now also want a dynamic article list)

**Go site-wide: one root `/query-index.json` with article fields.** This is the best fit now that two features will read the index (the hero's eyebrow lookup **and** a dynamic article listing):

- **One index powers both features and every locale root.** The listing filters rows by path prefix (`/us/en/newsroom/press-releases/…` or `/language-masters/en/…`) client-side; the hero finds its parent row the same way. No per-section, per-locale index duplication — the exact problem you've hit twice.
- **A dynamic listing wants breadth, not a pre-scoped file.** With the site-wide index the listing can show press releases now and be repointed to any other section later by changing a path filter — no new index config.
- **Simplest block logic:** always fetch `/query-index.json`; filter/find by path. Root-agnostic.

Trade-off: larger payload (all pages) and it touches the shared root index. At this scale that's negligible; if it ever matters, add a filtered/section index later without changing the block contract.

**When per-section would win instead:** only if the press-release set becomes very large and you want a tiny, cache-isolated file per section. Not your situation today.

**Decision:** proceed with **Option B (site-wide root index)** unless you object. Also confirmed: the **eyebrow link will be emitted without the `.html` extension** (drop last segment + strip `.html`).

> Execution requires **Execute mode** — this plan is read-only until then.

## Planned Changes (Option B — site-wide)

1. **`helix-query.yaml`** — Extend the existing `pages` root index (`target: /query-index.json`) with article fields: `title`, `description`, `image`, `published`, `category`, `categoryUrl`, plus existing `lastModified`, `robots`. Sourced from the meta tags already emitted (`publishdate`, `categorytitle`, `categoryurl`, `og:*`). Keep the `/us/en` `press-releases` index or retire it (see checklist).
2. **`blocks/article-header/article-header.js`** — Eyebrow **Link**: when the `eyebrowLink` cell is empty, derive from `window.location.pathname` — drop the last (article) segment and **strip `.html`** (root-preserving; produces e.g. `/us/en/newsroom/press-releases/customer-first`).
3. **`blocks/article-header/article-header.js`** — Eyebrow **Title**: when the `eyebrow` cell is empty, fetch `/query-index.json`, find the parent row by the derived path, use its `title`/`category`. Fallback chain: authored → root-index lookup → `categorytitle` meta → humanized last path segment.
4. **`blocks/article-header/article-header.js`** — **Article Date + read time: unchanged.**
5. **`blocks/article-header/_article-header.json`** — Note auto-derivation for `eyebrow`/`eyebrowLink` when blank; `articleDate` unchanged; `npm run build:json` if descriptions change.
6. **(Later / separate)** the dynamic article listing block consumes the same `/query-index.json`, filtered by path prefix — scoped as a follow-up, not built in this change.

## Checklist

- [ ] Confirm **Option B (site-wide root index)** as the strategy (recommended); note the future listing block will reuse `/query-index.json`
- [ ] `helix-query.yaml`: add `title, description, image, published, category, categoryUrl` to the `pages` root index (sourced from existing meta tags); keep `lastModified`, `robots`
- [ ] Decide: retire the `/us/en/newsroom/press-releases` section index or keep it alongside the root index
- [ ] Validate YAML parses; index targets distinct
- [ ] `article-header.js`: derive Eyebrow Link from `window.location.pathname` when empty — drop last segment **and strip `.html`**, root-preserving
- [ ] `article-header.js`: derive Eyebrow Title via `/query-index.json` lookup (fallback authored → index → `categorytitle` meta → humanized segment)
- [ ] Leave Article Date + read-time rendering unchanged (no regression)
- [ ] Preserve authored-value-wins for eyebrow Title + Link (optional overrides, no fields removed)
- [ ] Update `_article-header.json` eyebrow descriptions; leave `articleDate`; run `npm run build:json` if changed
- [ ] Verify `/us/en` InterGlobe page: eyebrow link → `/us/en/newsroom/press-releases/customer-first` (no `.html`), title from root index
- [ ] Verify `/language-masters/en` page: eyebrow link → `/language-masters/en/...` root (no `.html`), title from root index
- [ ] Lint `article-header.js` + validate `helix-query.yaml`
- [ ] Commit & push focused changes — **Execute mode required**
- [ ] Follow-up (separate scope): dynamic article listing block reading `/query-index.json`, filtered by section path prefix
