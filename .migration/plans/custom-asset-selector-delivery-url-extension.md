I'll check the current state of both blocks to ground the plan accurately.# Revert Headshot Field to `_path` (Keep Plain `<img>`, No `createOptimizedPicture`)

## Goal

The GraphQL response was reverted so the headshot URL is back under `_path` (not `path`). Update both leadership blocks to read `headshot._path` again — while **keeping** the current plain `<img>` rendering (no `createOptimizedPicture`), since the value is a Dynamic Media delivery URL that needs no optimization.

## Current state (verified)

- `blocks/leadership-listing/leadership-listing.js:52` → `const headshot = item.headshot && item.headshot.path;` then a plain `<img>` (lines 56–58).
- `blocks/leadership-details/leadership-details.js:101` → `const headshot = data.headshot && data.headshot.path;` then a plain `<img>` (lines 106–108).
- Both files already have the `/* eslint-disable no-underscore-dangle */` header (needed once we go back to `_path`), and both already use plain `<img>` — so **only the property accessor changes**.

## Changes

### 1. `blocks/leadership-listing/leadership-listing.js`
- Line 52: `item.headshot.path` → `item.headshot._path`.
- Leave the plain `<img>` block (src/alt/loading=lazy) unchanged. Comment already reads "_path is already a Dynamic Media delivery URL" — now accurate.

### 2. `blocks/leadership-details/leadership-details.js`
- Line 101: `data.headshot.path` → `data.headshot._path`.
- Leave the plain `<img>` block (src/alt, eager for LCP) unchanged.

> Note: the `no-underscore-dangle` eslint-disable header is already present in both files, so `_path` won't trip lint.
> Out of scope: `leadership-list-cf.js` (uses `data.headshot` string + `createOptimizedPicture`) is the separate original block — untouched.

## Verify

- `npm run lint:js` — expect clean (underscore-dangle already disabled).

## Checklist

- [ ] `leadership-listing.js:52` — `item.headshot.path` → `item.headshot._path`
- [ ] `leadership-details.js:101` — `data.headshot.path` → `data.headshot._path`
- [ ] Confirm plain `<img>` rendering retained in both (no `createOptimizedPicture`)
- [ ] Run `npm run lint:js` — clean
- [ ] Leave changes uncommitted for manual review

---

*Execution requires Execute mode — this artifact is the plan only.*
