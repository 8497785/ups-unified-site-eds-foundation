I'll review the current CSS for both blocks so the skeleton plan matches their existing structure.# Skeleton Loading States for Leadership Blocks

## Goal

Add skeleton (shimmer placeholder) UI to the **leadership-listing** and **leadership-details** blocks so the layout paints immediately while the GraphQL persisted-query fetch is in flight. This gives the browser real content to render early (better FCP), reserves the correct space so the eventual images/text don't shift the layout (better LCP / avoids CLS), and removes the current "empty block then sudden pop-in" behavior.

## Current behavior (why skeletons help)

- **`leadership-listing.js`**: builds the header + an empty `<ul>`, calls `block.replaceChildren(...)`, then `await`s `fetchLeaders(url)` and appends cards. Between paint and fetch-resolve the `<ul>` is empty — no content, no reserved card space.
- **`leadership-details.js`**: `await`s `fetchLeader(url)` *before* rendering anything, then `block.replaceChildren(content, media)`. Until the fetch resolves the block is completely empty, and on failure it renders nothing. This is the bigger LCP problem — the portrait (likely the LCP element) only appears post-fetch.

Skeletons fix both by painting sized placeholders synchronously, before the `await`.

## Approach

1. **Shared shimmer style** — add a reusable skeleton base + `shimmer` keyframe animation. Put it in `styles/styles.css` (global) so both blocks reuse one animation and one set of tokens, respecting `prefers-reduced-motion`.
2. **Listing block** — render N skeleton cards inside the `<ul>` *before* the `await`, matching the real card's flex layout (image column + body lines). Replace them with real cards once data arrives; if the fetch returns empty/fails, clear the skeletons.
3. **Details block** — render a skeleton two-column layout (text lines on the left, portrait block on the right) synchronously before the `await`, then swap in the real content. On failure, clear the skeleton (same as today's "render nothing").

### Design decisions to confirm before coding

- **Skeleton card count (listing):** default to **6** placeholder cards (fills a 2-column grid nicely above the fold). Can be tuned.
- **Reduced motion:** honor `prefers-reduced-motion: reduce` by showing a static muted background instead of the moving shimmer (accessibility best practice).
- No new dependencies; pure CSS animation + DOM built with `document.createElement`.

## Implementation detail

### 1. `styles/styles.css` — shared skeleton primitives

Add near the other utility styles:

```css
@keyframes ups-skeleton-shimmer {
  0%   { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}

.ups-skeleton {
  background: #ececec;
  background-image: linear-gradient(90deg, #ececec 0px, #f5f5f5 40px, #ececec 80px);
  background-size: 600px 100%;
  border-radius: 4px;
  animation: ups-skeleton-shimmer 1.4s ease infinite;
}

@media (prefers-reduced-motion: reduce) {
  .ups-skeleton { animation: none; }
}
```

### 2. `blocks/leadership-listing/leadership-listing.js`

- Add a `renderSkeletonCard()` helper returning an `<li class="leadership-card-skeleton">` whose inner structure mirrors `renderCard` (an image block + body with a title bar and a subtitle bar), each placeholder using `ups-skeleton`.
- After building `ul` and calling `block.replaceChildren(...)`, append `SKELETON_COUNT` (=6) skeleton `<li>`s to `ul` **before** `await fetchLeaders(url)`.
- After the fetch resolves: `ul.replaceChildren()` to clear skeletons, then append real cards (or leave empty if none).

### 3. `blocks/leadership-listing/leadership-listing.css`

Add skeleton card styles that reuse the existing card box (shadow, radius, row layout) so the placeholder occupies the exact card footprint:

- `.leadership-listing li.leadership-card-skeleton` — same shadow/radius/overflow as real `li`.
- Skeleton image block: `width:180px` (103px ≤1023px, matching real image breakpoints), full height.
- Skeleton body: gold bar + one wide title bar (~70% width, ~24px tall) + one subtitle bar (~40% width, ~13px tall), matching real card spacing.

### 4. `blocks/leadership-details/leadership-details.js`

- Add a `renderSkeleton()` helper that builds the same two-column shell used by the real render: a `.leadership-bio-content` column with a name bar, a title bar, and several body-line bars; and a `.leadership-bio-media` column with a portrait placeholder block.
- Call `block.replaceChildren(renderSkeleton())` (or append into the block) **before** `await fetchLeader(...)`.
- After the fetch: on success replace with the real `content` + `media`; on null/failure `block.replaceChildren()` (unchanged fail behavior).
- Keep the early `if (!cfPath)` guard returning empty (no skeleton when nothing to load).

### 5. `blocks/leadership-details/leadership-details.css`

Add skeleton styles sized to the real layout so there's no shift when the portrait/text swap in:

- Name bar (~48px tall block), title bar, 4–5 body-line bars of varying widths.
- Portrait placeholder matching `.upspr-bio-image img` footprint (`width:100%`, `border-radius:8px`, an aspect ratio approximating the headshot, e.g. `aspect-ratio: 3 / 4`).
- Reuse `.ups-skeleton`; keep file-top `stylelint-disable` comments as-is.

## Verification

- Run `npm run lint:js` and `npm run lint:css` — expect clean (watch `selector-class-pattern` for any new class names; prefix with existing conventions or covered by the file-top disable in the details CSS).
- Preview both pages: confirm skeletons appear instantly on load, then swap to real content; throttle network to see the shimmer; confirm no layout shift when real content replaces the skeleton.
- Confirm `prefers-reduced-motion` disables the animation (static placeholder still shows).
- Confirm empty/failed fetch clears skeletons (no leftover placeholders).

## Checklist

- [ ] Add `.ups-skeleton` base class + `ups-skeleton-shimmer` keyframes + reduced-motion override to `styles/styles.css`
- [ ] Add `renderSkeletonCard()` + pre-fetch skeleton rendering (6 cards) to `leadership-listing.js`; clear skeletons before appending real cards
- [ ] Add skeleton card styles (image column + gold bar + title/subtitle bars, with responsive image widths) to `leadership-listing.css`
- [ ] Add `renderSkeleton()` two-column shell + pre-fetch rendering to `leadership-details.js`; swap to real content on success, clear on failure
- [ ] Add skeleton styles (name/title/body bars + portrait placeholder) to `leadership-details.css`
- [ ] Run `npm run lint:js` and `npm run lint:css` — resolve any issues
- [ ] Preview both blocks (with network throttling) to confirm skeleton → content swap with no layout shift, and reduced-motion behavior
- [ ] Leave all changes uncommitted for manual review/commit

---

*Note: execution requires Execute mode — this artifact is the plan only. Confirm the skeleton card count (default 6) and I'll implement on approval.*
