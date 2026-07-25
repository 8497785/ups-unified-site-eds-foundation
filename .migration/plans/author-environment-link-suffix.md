# Shared Author-Aware Internal Link Helper (`.html` on author only)

## Objective

Add a single shared helper in `scripts/config.js` that decides whether an internal link href needs a `.html` suffix based on the current environment, so blocks can build links that work in **both** the AEM author URL space (needs `.html`) and the EDS delivery tiers (`.aem.page` / `.aem.live`, clean URLs). Per your decisions:

- **Scope: helper only.** Add the function to `scripts/config.js` now. **Do not** wire it into any block yet — blocks adopt it in follow-ups after you review the helper.
- **Author detection: adobeaemcloud author host only.** Add `.html` when the hostname is the AEM author host (`*.adobeaemcloud.com`). Everything else (`.aem.page`, `.aem.live`, `localhost`, custom domains, UE preview) stays clean (no `.html`).
- **Never touch assets or external URLs.** Do **not** add `.html` to `/content/dam/...` or other asset URLs, and do **not** touch external/absolute URLs. Those are returned unchanged. ← **new this turn**

> This plan adds a utility only. Implementation requires **Execute mode** — this artifact captures the finalized design and steps.

## Why `scripts/config.js`

It already centralizes environment-aware logic — `resolveGraphqlHost()` keys off `hostname.endsWith('.aem.page') || '.aem.live'` to switch behavior between delivery tiers and author/other origins. The `.html` decision is the same class of concern, so the helper belongs here next to that logic, exported for any block to import.

## Proposed helper (design)

Add to `scripts/config.js`:

```js
// Paths that must never receive a .html suffix (assets, not pages).
const NON_PAGE_PREFIXES = ['/content/dam/', '/media_', '/assets/'];
// File extensions that indicate an asset, not an authored page.
const ASSET_EXT = /\.(?:jpe?g|png|gif|svg|webp|avif|ico|pdf|zip|mp4|webm|mov|mp3|json|xml|css|js|woff2?|ttf|eot)$/i;

/**
 * True only on the AEM author environment (adobeaemcloud.com), where internal
 * page links must carry a .html suffix. Delivery tiers (.aem.page/.aem.live),
 * localhost, and custom domains serve clean (extensionless) URLs.
 */
function isAuthorEnvironment() {
  return window.location.hostname.endsWith('.adobeaemcloud.com');
}

/**
 * Normalize an INTERNAL PAGE path for the current environment:
 * - author    -> ensure a single trailing ".html"
 * - elsewhere -> ensure NO ".html"
 * Returned unchanged (never suffixed) for:
 *  - empty/undefined input
 *  - external/absolute URLs (http(s):// or protocol-relative //)
 *  - anchors (#…), mailto:, tel:
 *  - asset URLs: /content/dam/ (and other asset prefixes) or any asset file ext
 *
 * @param {string} path internal page path or href (e.g. /us/en/newsroom)
 * @returns {string} environment-appropriate href
 */
export function authorLink(path) {
  if (!path) return path;

  // External / non-navigational — never touch.
  if (/^(https?:)?\/\//.test(path) || /^(#|mailto:|tel:)/.test(path)) return path;

  // Separate the path portion from any ?query / #hash.
  const hashOrQueryIndex = path.search(/[?#]/);
  const base = hashOrQueryIndex === -1 ? path : path.slice(0, hashOrQueryIndex);
  const tail = hashOrQueryIndex === -1 ? '' : path.slice(hashOrQueryIndex);

  // Asset URLs (DAM / media / known asset extensions) — never suffix.
  if (NON_PAGE_PREFIXES.some((p) => base.startsWith(p)) || ASSET_EXT.test(base)) {
    return path;
  }

  const clean = base.replace(/\.html$/, '');
  const href = isAuthorEnvironment() ? `${clean}.html` : clean;
  return `${href}${tail}`;
}
```

(Exact prefix/extension lists to be confirmed in code; intent below.)

## What gets a suffix vs. what is left alone

| Input | Author host | `.aem.page` / `.aem.live` / localhost |
|---|---|---|
| `/us/en/newsroom` (page) | `/us/en/newsroom.html` | `/us/en/newsroom` |
| `/us/en/newsroom.html` (already suffixed) | `/us/en/newsroom.html` (not doubled) | `/us/en/newsroom` (stripped) |
| `/us/en/newsroom?x=1#s` (query/hash) | `/us/en/newsroom.html?x=1#s` | `/us/en/newsroom?x=1#s` |
| `/content/dam/…/Crossdocks.jpg` (asset) | unchanged | unchanged |
| `/assets/favicons/favicon.ico` (asset) | unchanged | unchanged |
| `https://www.ups.com/...` (external) | unchanged | unchanged |
| `//cdn.example.com/x` (protocol-relative) | unchanged | unchanged |
| `#section`, `mailto:`, `tel:` | unchanged | unchanged |
| `` / `undefined` | returned as-is | returned as-is |

## Explicitly out of scope (this task)

- No changes to `breadcrumb.js`, `article-header.js`, `downloads.js`, `leadership-*`, or `header.js`. They keep building hrefs as they do today.
- No behavior change on any live page yet — the helper is dormant until a block imports it.
- Follow-up (separate): wire `authorLink()` into the breadcrumb crumb hrefs (line ~91) and other internal-link blocks, with per-block verification.

## Edge cases the helper must handle

- Empty/undefined input → return as-is.
- External/absolute URLs (`http(s)://`, protocol-relative `//`) → untouched.
- Anchors (`#…`), `mailto:`, `tel:` → untouched.
- **Asset URLs** → `/content/dam/...` (and other asset prefixes) and any known asset file extension (`.jpg`, `.png`, `.svg`, `.pdf`, `.json`, `.css`, `.js`, …) → untouched, no `.html`.
- Query string / hash on internal page paths → suffix applied to the path segment only, query/hash preserved.
- Already-suffixed `.html` → not doubled.
- Trailing slash (e.g. `/us/en/`) → normalize consistently.

## Verification (helper-level, since no blocks are wired)

- Simulated hostnames: author host adds `.html` for page paths; `.aem.page`/`.aem.live`/`localhost` stay clean.
- Assert `/content/dam/...` and asset-extension URLs are returned **unchanged on all hosts** (including author).
- Confirm external URLs, protocol-relative, anchors, mailto/tel, query/hash, and already-`.html` inputs match the table.
- Lint `scripts/config.js`.

## Checklist

- [ ] Add `isAuthorEnvironment()` (matches `*.adobeaemcloud.com`) and exported `authorLink(path)` to `scripts/config.js` — **Execute mode**
- [ ] Implement suffix rules: author → ensure single `.html`; all other origins → strip `.html`; idempotent
- [ ] Guard external URLs, protocol-relative, anchors, `mailto:`/`tel:`, empty input (return untouched)
- [ ] **Guard asset URLs: `/content/dam/` (and other asset prefixes) and known asset file extensions → never suffix, returned unchanged on every host**
- [ ] Preserve query string / hash; apply suffix to the path portion only
- [ ] Do NOT modify any block (`breadcrumb`, `article-header`, `downloads`, `leadership-*`, `header`) in this task
- [ ] Lint `scripts/config.js`
- [ ] Validate behavior across simulated hostnames (author / `.aem.page` / `.aem.live` / localhost) and all edge cases above, including DAM/asset exclusion
- [ ] Report the helper's API + examples so you can review before any block adopts it
- [ ] (Follow-up, separate) Wire `authorLink()` into breadcrumb hrefs, then other internal-link blocks, with per-block testing
