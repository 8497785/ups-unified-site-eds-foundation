Let me investigate the content-list index resolution logic to confirm what's happening.Let me check where query indexes actually live and confirm the live page's behavior.# Fix Content List Query-Index 404 (Probe Parent, Not Category)

## The "why" — what's happening now
On the customer-first page you selected **Category = customer-first**, so `filterPrefix = /us/en/newsroom/press-releases/customer-first`.

The block's `candidateIndexPaths()` (blocks/content-list/content-list.js:46) walks up from the **category path itself**, nearest-first:

1. `/us/en/newsroom/press-releases/customer-first/query-index.json` → **404** ← the call you're seeing
2. `/us/en/newsroom/press-releases/query-index.json` → **200** ← this is the real one, and the block does use it

So your expectation is correct: only the parent (`press-releases`) index should be hit. The first call is a **guaranteed 404** because no query-index is defined at the category level (helix-query.yaml only targets `/query-index.json`, `/us/en/query-index.json`, and `/us/en/newsroom/press-releases/query-index.json`). The block *does* fall back and render correctly, but that 404 is spurious network noise and shouldn't be there.

## Root cause
The probe starts at the **category path**, but a category never owns an index — its **parent section** does. Starting the walk-up at the category guarantees one wasted 404 on every category page.

## The fix
In `candidateIndexPaths()`, start the walk-up from the **parent** of the category (drop the last path segment first). For `customer-first` this makes the very first (and only) call `/us/en/newsroom/press-releases/query-index.json` → 200. Keep the walk-up-to-root fallback for robustness.

- Category `/us/en/newsroom/press-releases/customer-first` → probes `/us/en/newsroom/press-releases/query-index.json` first ✓ (no 404)
- Retains fallback: if that missed, it continues up (`/us/en/newsroom`, `/us/en`, …).

**Note on the legacy/section-landing case:** the press-releases listing page uses the *explicit* `indexPath` form (its first cell is the `query-index.json` link), which bypasses `candidateIndexPaths()` entirely — so this change doesn't affect it. The category-driven form is only used for true sub-category pages, where the index always lives at the parent section.

## Files
- `blocks/content-list/content-list.js` — adjust `candidateIndexPaths()` to begin at the parent segment; update its doc comment.

## Verification
- Confirm on preview that customer-first now issues a single `.../press-releases/query-index.json` request (200) and **no** `.../customer-first/query-index.json` 404.
- Confirm the 39 customer-first cards still render (filter still uses the full category path as prefix).

## Checklist
- [ ] Update `candidateIndexPaths()` in content-list.js to start from the parent of the category path (drop last segment), keeping the upward fallback
- [ ] Refresh the doc comment to describe parent-first derivation
- [ ] Run eslint on blocks/content-list/
- [ ] Verify in preview: only `.../press-releases/query-index.json` (200) is called, no customer-first 404, cards still render
- [ ] Commit and push

> Note: executing these edits requires **Execute mode** — currently in plan mode.
