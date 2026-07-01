Let me review how both blocks build their GraphQL URLs and how the project exposes global config, to ground the plan.# Absolute GraphQL URLs via a Global Config Base

## Goal
Make every GraphQL call in the leadership blocks use an **absolute publish URL** (`https://publish-p55671-e392471.adobeaemcloud.com/graphql/...`) instead of a relative `/graphql/...` path, with the host read from **one global config value** so it can be changed in a single place later.

> Yes — this is possible and is the correct approach. Centralizing the host in one config avoids hardcoding it in each block. Execution requires **Execute mode**.

## Where it's used today
- `blocks/leadership-listing/leadership-listing.js` → `buildQueryUrl()` builds `/graphql/execute.json/ups-global/leadership-list;...`
- `blocks/leadership-details/leadership-details.js` → `buildQueryUrl()` builds `/graphql/execute.json/ups-global/leadership-details;path=...`
- Both currently produce **relative** URLs.

## The correct pattern (single source of truth)
Introduce **one** GraphQL base host, consumed by both blocks. Two viable homes for that config — pick one (see question):

1. **Shared JS module** (`scripts/config.js` exporting `AEM_GRAPHQL_HOST`), imported by both blocks. Simplest; changing the URL = editing one constant. Value lives in code.
2. **EDS metadata / placeholders** (author-editable): read the host from a `<meta name="graphql-host">` (via `getMetadata`) or the `placeholders` sheet, so it can be changed **without a code deploy**. More flexible; needs the meta/sheet wired.

Both make the URL absolute: `` `${GRAPHQL_HOST}/graphql/execute.json/${project}/${query};...` ``. If the host value is empty, fall back to relative (`''`) so author/UE same-origin still works.

## Open Decisions (need answers before build)
1. **Config location:** shared JS constant vs. author-editable metadata/placeholders.
2. **Fallback behavior:** if host is blank, use relative (recommended) or hard-require the absolute host.

## Design (illustrative, JS-constant variant)
```js
// scripts/config.js
export const AEM_GRAPHQL_HOST = 'https://publish-p55671-e392471.adobeaemcloud.com';
```
```js
// in each block
import { AEM_GRAPHQL_HOST } from '../../scripts/config.js';
function buildQueryUrl(project, query, /* params */) {
  const base = AEM_GRAPHQL_HOST || '';
  return `${base}/graphql/execute.json/${project}/${query};...`;
}
```

## Risks / Notes
- **CORS:** absolute cross-origin calls from `.aem.page`/`.aem.live` to the publish host will need the publish tier to **allow those origins** (`Access-Control-Allow-Origin`) — otherwise the fetch fails with CORS even though the URL is correct. This is an AEM-side config, not repo.
- **Author/UE:** on `*.adobeaemcloud.com` the absolute publish host is cross-origin too; the empty-host fallback keeps it relative there if desired. Confirm whether you want absolute **everywhere** or only off-AEM.
- **Trailing slash:** ensure `HOST` has no trailing slash to avoid `//graphql`.
- **No commit** unless you say so (matching your recent workflow) — confirm.

## Checklist

### Phase 0 — Decisions
- [ ] Choose config location: shared JS constant `scripts/config.js` vs. author-editable meta/placeholders
- [ ] Confirm fallback: blank host → relative (recommended) vs. always absolute
- [ ] Confirm commit preference (leave uncommitted vs. commit)

### Phase 1 — Add Global Config
- [ ] Create the single config source (`scripts/config.js` const, or a `getMetadata('graphql-host')` reader) with the publish host
- [ ] Strip any trailing slash defensively

### Phase 2 — Wire Both Blocks
- [ ] `leadership-listing.js`: prefix `buildQueryUrl` with the config host
- [ ] `leadership-details.js`: prefix `buildQueryUrl` with the config host
- [ ] Keep empty-host fallback → relative

### Phase 3 — Validate
- [ ] `npm run lint`
- [ ] Simulate both URLs → confirm `https://publish-.../graphql/execute.json/...;...`
- [ ] Note CORS requirement on publish for `.aem.page`/`.aem.live`

### Execution Note
- [ ] Answer Phase 0 (config location + fallback), then switch to **Execute mode**. Recommended: `scripts/config.js` constant now (easy one-line update later), with a relative fallback for author/UE.
