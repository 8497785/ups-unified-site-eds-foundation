Let me review the current breadcrumb block and path mapping to plan the fix precisely.# Fix Breadcrumb — Strip Content-Root Prefix

## Goal
Make the **Breadcrumb** block render the clean trail (`Home / Our Company / Leadership`) instead of the raw JCR path (`Home / Content / About Ups Eds / Us / En / Our Company / Leadership`), matching the existing UPS site.

> Execution requires **Execute mode**. This artifact is the plan only.

## Root Cause
`blocks/breadcrumb/breadcrumb.js` builds crumbs directly from `window.location.pathname`. In the AEM author / Universal Editor context the pathname is the **full content path** `/content/about-ups-eds/us/en/our-company/leadership`, so every JCR ancestor segment (`content`, `about-ups-eds`, `us`, `en`) becomes a crumb. On the clean published URL the prefix is stripped by `paths.json`, but the block must produce the same clean trail in **all** contexts.

## The Fix
Normalize the pathname before splitting into segments, by removing the content-root prefix that `paths.json` maps away:
- **Strip prefix:** `/content/about-ups-eds/us/en` (and a trailing `/home`) → so `/content/about-ups-eds/us/en/our-company/leadership` becomes `/our-company/leadership`.
- **Also handle the already-clean case:** if the pathname is already `/our-company/leadership` (published tier), stripping a non-present prefix is a no-op — same result.
- **Drop a leading `home` segment** if present, since Home is always rendered as the first crumb pointing to `/`.
- Keep the existing label resolution (ancestor page title → title-cased slug) and clean-link generation, but generate ancestor links from the **normalized** path so they resolve to clean URLs (`/our-company`).

### Prefix source
The prefix to strip corresponds to `paths.json` `includes`/`mappings`: `/content/about-ups-eds/us/en/`. Implement as a small constant (and tolerate optional leading/trailing slashes) so the block is robust on author, preview, and publish.

## Expected Result
- Author/UE: `Home / Our Company / Leadership`
- Publish: `Home / Our Company / Leadership`
- Links: Home → `/`, Our Company → `/our-company`, Leadership → active (no link).

## Risks / Notes
- **Label resolution path:** ancestor-title `fetch` must use the normalized clean path (`/our-company.plain.html`), not the JCR path; otherwise it 404s and silently falls back to title-case (still correct text, but avoids needless failed requests).
- **Hard-coded prefix:** the content root is project-specific; documented as a constant tied to `paths.json`. If the site root changes, update the constant.
- **Bio detail pages:** same fix automatically yields `Home / Our Company / Leadership / <Name>` correctly once applied.

## Checklist

### Phase 1 — Implement
- [ ] Add a `CONTENT_ROOT_PREFIX` constant (`/content/about-ups-eds/us/en`) in `breadcrumb.js`
- [ ] Normalize `window.location.pathname`: strip prefix, strip `.html`, drop leading `home` segment
- [ ] Build crumbs/links from the normalized path (clean URLs)
- [ ] Use normalized paths for ancestor-title `fetch` lookups

### Phase 2 — Validate
- [ ] `npm run lint` (JS) passes
- [ ] Verify trail on leadership page = `Home / Our Company / Leadership`
- [ ] Verify a bio page = `Home / Our Company / Leadership / <Name>`
- [ ] Confirm links resolve to clean URLs (`/`, `/our-company`)

### Phase 3 — Ship
- [ ] Commit and push to `origin/main`

### Execution Note
- [ ] Switch to **Execute mode** to implement Phases 1–3.
