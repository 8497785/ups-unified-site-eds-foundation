# Render GraphQL Headshot as a Dynamic Media Delivery URL

## Resolved: the response already contains the delivery URL

Your `headshot` object includes a ready-made delivery path:

```json
"_dynamicUrl": "/adobe/dynamicmedia/deliver/dm-aid--7a516535-8c5c-4287-b64a-b0747ad2f820/ups_leadership_ELT_Tome_Carol_B_LoRes.jpg"
```

This is **exactly** the format the image block produces — it's just missing the query params. So we don't need to assemble anything from the dm-aid: **use `headshot._dynamicUrl` and append `?quality=85&width=1280&preferwebp=true`.**

- `_path` → repository path (what we use now; not a delivery URL) → **switch away from this**
- `_dynamicUrl` → the DM deliver path → **use this**
- `_dmS7Url` / `_id` → not needed

## Approach

### 1. Add a URL builder in `scripts/config.js`
One shared helper (matches the image-block params):

```js
const DM_IMAGE_PARAMS = { quality: '85', preferwebp: 'true' };

// dynamicUrl is the GraphQL headshot._dynamicUrl (already /adobe/dynamicmedia/deliver/...)
export function getDynamicMediaUrl(dynamicUrl, { width = 1280 } = {}) {
  if (!dynamicUrl) return '';
  const sep = dynamicUrl.includes('?') ? '&' : '?';
  return `${dynamicUrl}${sep}quality=${DM_IMAGE_PARAMS.quality}&width=${width}&preferwebp=${DM_IMAGE_PARAMS.preferwebp}`;
}
```
- Defaults to `width=1280` (same as image block). `width` overridable per call.
- Guards empty input (returns `''`).

### 2. Use it in both blocks (plain `<img>`, no `createOptimizedPicture`)

**`blocks/leadership-listing/leadership-listing.js`** (~line 52–58):
- Read `item.headshot._dynamicUrl` (fallback to `_path` if `_dynamicUrl` missing, so nothing breaks on older data).
- `img.src = getDynamicMediaUrl(dynamicUrl, { width: 400 })` — cards are small; 400 keeps payload light. Keep `loading = 'lazy'`, `alt`.

**`blocks/leadership-details/leadership-details.js`** (~line 101–108):
- Read `data.headshot._dynamicUrl` (same fallback).
- `pic.src = getDynamicMediaUrl(dynamicUrl, { width: 1280 })` — portrait is large/LCP. Keep eager, `alt`.

### 3. Download overlay (detail block, High/Low res)
Currently `highResUrl`/`lowResUrl` default to the headshot `_path`. Update the fallback to the **base `_dynamicUrl`** (no width param = full-resolution download) so the download links point at the real DM asset, not the repo path. Author-provided `customHighRes`/`customLowRes` still win when set. `download` attribute stays.

### 4. Verify
- `npm run lint:js` — clean (note: `_dynamicUrl`/`_path` still need the existing `no-underscore-dangle` disable, already present in both files).
- Console/preview check: assembled URL equals `…/dm-aid--<uuid>/<file>.jpg?quality=85&width=<w>&preferwebp=true` and the image loads.

## Notes
- `getDynamicMediaUrl` lives in `config.js` (already imported by both blocks for `getGraphQLUrl`) — no new imports needed beyond adding it to the existing import.
- Fallback to `_path` is defensive only; primary is `_dynamicUrl`.

## Checklist

- [ ] Add `getDynamicMediaUrl(dynamicUrl, { width })` to `scripts/config.js` (params `quality=85&width=<w>&preferwebp=true`)
- [ ] `leadership-listing.js`: use `item.headshot._dynamicUrl` (fallback `_path`) → `getDynamicMediaUrl(url, { width: 400 })`, keep lazy `<img>`
- [ ] `leadership-details.js`: use `data.headshot._dynamicUrl` (fallback `_path`) → `getDynamicMediaUrl(url, { width: 1280 })`, keep eager `<img>`
- [ ] Update detail download links (`highResUrl`/`lowResUrl`) to default to `_dynamicUrl` (full-res, no width) instead of `_path`
- [ ] Add `getDynamicMediaUrl` to the existing `config.js` import in both blocks
- [ ] Run `npm run lint:js` — clean
- [ ] Leave changes uncommitted for manual review

---

*Execution requires Execute mode — this artifact is the plan only.*
