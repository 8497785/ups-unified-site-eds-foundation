Let me review the current breadcrumb implementation and confirm how the query-index and page paths actually behave before assessing your version.Let me check the breadcrumb CSS (markup expectations) and whether the intermediate parent pages actually exist as index rows.Let me verify the actual index URL and path format this site uses, since your code fetches `/us/en/query-index.json`.Bash is blocked in plan mode, but I already have the two things I need to assess this: the current `breadcrumb.js` and the configured index targets (`helix-query.yaml` has `/query-index.json` site-wide and `/us/en/newsroom/press-releases/query-index.json` — there is **no** `/us/en/query-index.json`). Let me confirm the direction with you before finalizing the assessment.# Breadcrumb via query-index — Assessment & Adaptation Plan

## Will the proposed code work as-is? No — but the approach is sound with fixes

Your snippet is a reasonable query-index-driven breadcrumb, and switching the label source to a single `query-index.json` fetch is a legitimate improvement over the current per-ancestor `.plain.html` fetches. **But as written it would render an empty/broken breadcrumb on this site.** Below is exactly why, and the plan to adapt it — incorporating your two decisions: **add a `/us/en/query-index.json` locale index**, and **always show every segment with a slug fallback** (no gaps).

> This is an assessment + adaptation plan. Implementing it requires **Execute mode** — this artifact captures the finalized design and steps.

## Problems in the snippet (verified against the repo)

1. **Index URL doesn't exist (fatal).** The code fetches `${localeRoot}/query-index.json` = `/us/en/query-index.json`. `helix-query.yaml` only defines `/query-index.json` (site-wide) and `/us/en/newsroom/press-releases/query-index.json`. So today that fetch 404s → `pageMapPromise` rejects → `createBreadcrumb` throws → **no breadcrumb renders**. → *Decision: add the `/us/en/query-index.json` index so the URL resolves.*

2. **Missing ancestors are silently dropped.** `if (title) breadcrumbs.push(...)` only adds a crumb when the exact path is an indexed row. The Newsroom and Press Releases **listing pages** may not be published/indexed, so you'd get **Home → (gap) → Article**. → *Decision: always render every segment; fall back to a title-cased slug when the index has no title.*

3. **Cached rejection sticks.** `pageMapPromise` is module-scoped and assigned before the `.ok` check; if the first fetch fails, the rejected promise is cached and every later call reuses the failure. Needs to reset on error.

4. **Home path assumption.** It hardcodes `${localeRoot}/home` and expects `pageMap.get(homePath)` to have a title. If `/us/en/home` isn't an indexed row, the Home crumb label is `undefined`. The current block just uses a static "Home" label + `/` href — safer.

5. **Root-preservation vs. delivery paths.** The snippet keeps full `/us/en/...` paths for crumb hrefs. The **current** block strips `/us/en` (and the content prefix) to produce clean delivery paths (`/newsroom/...`) and matches how the site actually serves links. Mixing the two would produce links that don't match the site's URL scheme. Need to pick one consistently. (You publish under `/us/en`; the query-index rows use the served path, so hrefs should match those.)

6. **`homeLabel` field ignored.** The block model has an authorable `homeLabel`; the snippet drops it. Minor, but a regression in authorability.

7. **"First 4 items" truncation** is a behavior change (current shows all). Fine if intended, but should be a conscious choice, not incidental.

## Trade-off: query-index vs. current `.plain.html` approach

- **Snippet's win:** one `query-index.json` fetch total, memoized, vs. the current block's N parallel `.plain.html` fetches (one per ancestor). Fewer requests, better at scale.
- **Cost:** depends on ancestors being **indexed rows** to get real titles; where they aren't, you rely on the slug fallback (which is why Decision 2 matters). The current `.plain.html` approach reads each ancestor's actual `<title>` directly, so it gets real titles even for unindexed pages — at the cost of more requests.
- **Net:** the query-index approach is better *if* we add the locale index and keep the slug fallback for gaps. That's the plan.

## Target design (adapted, incorporating decisions)

- **Index:** add a new `us-en` index in `helix-query.yaml` → `target: /us/en/query-index.json`, `include: /us/en/**`, exposing at least `path` + `title` (reuse the existing property block). Keep the site-wide and press-releases indices.
- **Fetch:** memoize with error-reset (`pageMapPromise = null` in a `.catch`) so a transient 404 doesn't poison later renders. Tolerate a missing index (fall back to slugs, don't throw).
- **Crumbs:** iterate **every** path segment under the locale root; label = `pageMap.get(path)` **or** title-cased slug (no dropped ancestors). Last crumb non-linked/active.
- **Home:** keep a static Home crumb (authorable `homeLabel`, href `/` or `${localeRoot}/home` — to confirm which home the site uses).
- **Path scheme:** make crumb hrefs match the query-index `path` values exactly (the served scheme), so links resolve.
- **Markup/CSS:** keep `<nav aria-label="Breadcrumb"><ul>…` to match existing `breadcrumb.css` (the snippet uses `<ol>`; either update CSS or keep `<ul>`).
- **Truncation:** decide explicitly whether to cap at 4 (confirm; default = show all, matching current).

## Open questions to confirm at execution

- Home crumb: static "Home" → `/` (current) vs. index-driven `/us/en/home`?
- Truncate to first 4 crumbs, or show all?
- Keep `<ul>` markup (matches current CSS) or move to `<ol>` and update CSS?
- Crumb href scheme: full `/us/en/...` (matches query-index rows) — confirm the site serves links at that path, not the stripped `/newsroom/...`.

## Checklist

- [ ] Add `us-en` index to `helix-query.yaml` → `target: /us/en/query-index.json`, `include: /us/en/**`, with `path` + `title` properties; validate YAML + distinct targets — **Execute mode**
- [ ] Rewrite `blocks/breadcrumb/breadcrumb.js` to fetch the locale `query-index.json` once, memoized, with error-reset so a failed fetch isn't cached
- [ ] Render **every** path segment; label from index title, else title-cased slug (no dropped ancestors)
- [ ] Preserve authorable `homeLabel`; confirm Home href/target
- [ ] Ensure crumb hrefs match the query-index `path` scheme so links resolve
- [ ] Keep `<nav><ul>` markup (or update `breadcrumb.css` if switching to `<ol>`)
- [ ] Confirm truncation policy (all vs. first 4) and apply
- [ ] Gracefully handle a missing/unpublished index (slug-only crumbs, never throw / never blank)
- [ ] Lint `breadcrumb.js`; validate `helix-query.yaml`
- [ ] Verify on a published `/us/en` press-release page: Home → Newsroom → Press Releases → Customer First → Article, correct labels + working links
- [ ] Backfill note: the new `/us/en/query-index.json` populates only after (re)publish of the `/us/en` tree
- [ ] Decide commit vs. preview-only delivery per your preference
