# Metadata-First Article Header — Feasibility Assessment (Deliverable Locked)

## Decisions confirmed

- **Publish-date semantics:** keep the current fallback (original **article date** if present, else the page publish/generation date). The assessment will document this as the defined strategy — no change needed.
- **Deliverable scope:** **assessment only** — evaluate whether the metadata-first approach is good. No code changes now; implementation is a later, separate effort.
- **Delivery:** downloadable `.md` via the preview URL (no git commit).

> Writing the file requires **Execute mode** — this plan holds the finalized content and steps.

## Verdict: Yes — the metadata-first approach is the right move

Rendering the Article Header from `<head>` page metadata (instead of fetching `/query-index.json` at runtime) is feasible with a small, low-risk edit and is architecturally better. Migration already emits `categorytitle` and `categoryurl` into `<head>`, so the block can read them synchronously and drop the network round-trip. The single genuine trade-off is documented below.

## Point-by-point assessment (what the doc will contain)

| # | Recommendation | Verdict | Assessment |
|---|---|---|---|
| 1 | Page metadata as single source of truth | ✅ Good | `categorytitle`/`categoryurl` already in `<head>`; render from them, no fetch. |
| 2 | Avoid downloading entire query-index | ✅ Strongest win | Today the block fetches `/query-index.json` and scans every row on every article page (O(all pages)); metadata read is O(1). |
| 3 | Simplify fallback chain | ✅ Good | Reorder to **authored → metadata → humanized**; drop the index step (see caveat). |
| 4 | Reconsider storing categoryUrl | ⚠️ Partial | Live link already derives from `window.location` (root-preserving). Stored `categoryurl` stays for query-index/SEO; block doesn't need it for the link. |
| 5 | Clarify publish-date strategy | ✅ Decided | Keep fallback (article date → else publish/generation date). Documented. |
| 6 | Reduce runtime logic | ✅ Good | Read meta → render. |
| 7 | Decouple rendering from search | ✅ Core win | Metadata fans out to *both* rendering and the index; rendering no longer depends on the index. |
| 8 | Configurable category resolution | ✅ Good | Encapsulate as `getCategoryPath()` for future `category/year/article` hierarchies. |
| 9 | Error handling / logging | ✅ Minor | Add `console.warn` when metadata is missing. |
| 10 | Define metadata ownership | ✅ Good | Ownership table (generator vs consumer) — fits in `docs/article-query-index.md`. |
| 11 | Minimize duplicate data | ⚠️ Judgement | `categoryurl` duplicates derivable path info, but the crawler can't run `window.location`, so the index needs a stored value. Keep for index; don't depend on it in the block. |
| 12 | Performance comparison | ✅ Accurate | Metadata-first removes a fetch + JSON parse per page. |

## The one caveat the doc will call out

The index lookup was intentionally placed **first** so the eyebrow uses the parent **category page's own (possibly human-curated) title**. Metadata-first instead uses **this article's** `categorytitle` (captured at migration from the source eyebrow). In practice identical ("Customer First"), so the trade is almost always a no-op — but it's a real behavioral change, accepted in exchange for the performance/scalability gain. The doc will state this explicitly.

## Delivery mechanism (preview download, no commit)

Write the assessment to the served content folder — `content/metadata-first-assessment.md` — reachable at `/content/metadata-first-assessment.md` on the preview host (same approach used earlier for the package zip). No git commit/push.

## Checklist

- [ ] Write the **assessment-only** `.md` (verdict, point-by-point table, the category-title caveat, publish-date strategy = fallback, performance comparison, recommended target architecture) — **requires Execute mode**
- [ ] Frame it as an evaluation, not an implementation plan (implementation deferred to a later, separate effort)
- [ ] Save to `content/metadata-first-assessment.md` for preview download
- [ ] Verify reachable over the preview URL (HTTP 200, correct content type) and share the exact path
- [ ] Do NOT commit or push the file (per request)
- [ ] Do NOT modify `article-header.js`, `helix-query.yaml`, or the generator in this task (assessment only)
