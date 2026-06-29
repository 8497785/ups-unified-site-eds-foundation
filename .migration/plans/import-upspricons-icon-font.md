# Import upspricons Icon Font & Convert Icons

## Goal
Add the source site's `upspricons` icon font to the project and render icons with the exact same `font-family: "upspricons", Tahoma, helvetica, arial, sans-serif`, converting the current SVG-based icons (footer social, leadership CTA arrow, header search, external-link/chevrons) to matching font glyphs.

> Execution requires **Execute mode**. This artifact is the plan only.

## Confirmed Decisions
- **Font delivery:** decode the source's base64 to real font files `/fonts/upspricons.woff` (+ `.ttf` fallback); reference via `@font-face`. ✅
- **Convert:** footer social icons, leadership CTA arrow, header search icon, external-link + chevrons. ✅

## Source Data Captured
- **`@font-face`** for `upspricons` (full base64 woff + ttf) — extracted from the live site.
- **43 glyph classes** enumerated: `upspr-icon-{next-circle, prev-circle, arrowleft-circle, arrowright-circle, facebook, linkedin, twitter, youtube, facebook-circle, linkedin-circle, twitter-circle, youtube-circle, chevrondown, chevronleft, chevronleft-thin, chevronright, chevronright-thin, chevronup, dot, globe, globe2, menu, minus, newwindow, x, x-circle, x-circle-solid, global-search, mail-circle, phone, van, openbox, deliveryperson, globe-big, download, exclamationcircle, print, checkcircle-solid, instagram-circle, warning, ...}`.
- **⚠️ Glyph code points NOT yet captured** — the `content` values are PUA chars (e.g. `\e900`) that returned empty in extraction. **First execution step** re-extracts each class's code point via `getComputedStyle(el,'::before').content` / `charCodeAt` so the CSS `content:` values are exact.

## Design

### 1. Font files + face (`/fonts/`, `styles/fonts.css`)
- Decode base64 → `fonts/upspricons.woff` and `fonts/upspricons.ttf`.
- Add `@font-face { font-family: upspricons; src: url('../fonts/upspricons.woff') format('woff'), url('../fonts/upspricons.ttf') format('truetype'); font-weight: normal; font-style: normal; }`.
- Note `fonts.css` is loaded by `loadFonts()` in `scripts.js`.

### 2. Icon glyph classes (new `styles/icons.css` or appended to `styles.css`)
- Base: `.upspr, [class^="upspr-icon-"], [class*=" upspr-icon-"] { font-family: "upspricons", Tahoma, helvetica, arial, sans-serif; font-weight: normal; font-style: normal; line-height: 1; -webkit-font-smoothing: antialiased; }`
- Per-glyph: `.upspr-icon-<name>::before { content: "\eXXX"; }` using the **re-extracted** code points.
- Ensure this CSS is loaded site-wide (import into `styles.css` or add to `head.html`/lazy styles).

### 3. Convert existing icons
- **Footer social** (`footer.css` ul:nth-of-type(3) li a::before): replace the 5 SVG `mask-image` rules with `font-family: upspricons` + `content` for `facebook-circle / twitter-circle / instagram-circle / linkedin-circle / youtube-circle` (source uses circular variants).
- **External link** (`footer.css` a[href^="https://"]::after, and similar): use `upspr-icon-newwindow` glyph.
- **Leadership CTA arrow** (`leadership-list-cf.css .leadership-list-cta::after`): replace inline SVG data-URI with `upspr-icon-arrowright-circle` glyph.
- **Header search** (`header.js` builds an inline `<svg>`): swap to an `<i class="upspr upspr-icon-global-search">` (or apply glyph via CSS on the search button); update `header.css` accordingly.
- **Chevrons** (nav expanders / `chevrondown`/`chevronright` where applicable): apply glyphs where the project currently uses bespoke markers, without breaking the hamburger animation.

## Risks / Notes
- **Code points are the critical unknown** — must re-extract exact `\eXXX` values; wrong codes = wrong/blank glyphs. Gate all `content:` edits on this.
- **Decoding base64 to binary** must preserve bytes exactly (write via Node Buffer from the captured base64).
- **Visual parity:** source social icons are circular (`-circle`); confirm size/color (currentcolor, 20px) matches existing footer sizing after swap.
- **Header search is JS-built SVG** — converting means editing `header.js` + CSS; verify click/aria still work.
- **Don't break** the hamburger icon (pure CSS bars) or breadcrumb `/` separator (intentional text) — leave those unless explicitly chosen.
- **Lint:** stylelint may flag PUA `content` strings; use standard escaped unicode (`"\eXXX"`).
- **Full-bleed/other blocks** unaffected.

## Checklist

### Phase 1 — Extract & Add Font
- [ ] Re-extract exact glyph code points for all `upspr-icon-*` classes from the live site (charCodeAt on `::before` content)
- [ ] Decode base64 → `fonts/upspricons.woff` and `fonts/upspricons.ttf` (byte-exact)
- [ ] Add `@font-face` for `upspricons` to `styles/fonts.css`
- [ ] Add icon base class + per-glyph `content` rules (new `styles/icons.css` or into `styles.css`); ensure site-wide load

### Phase 2 — Convert Icons
- [ ] Footer social → `*-circle` glyphs (replace SVG masks)
- [ ] Footer external-link → `newwindow` glyph
- [ ] Leadership CTA arrow → `arrowright-circle` glyph (replace inline SVG)
- [ ] Header search → `global-search` glyph (update `header.js` + `header.css`)
- [ ] Chevrons where applicable (nav expanders) without breaking hamburger

### Phase 3 — Validate
- [ ] `npm run lint` (CSS + JS) passes
- [ ] Preview: footer social, CTA arrow, search, external-link render correct glyphs with `upspricons` font-family
- [ ] Confirm sizes/colors match source; no blank/▯ glyphs (code points correct)
- [ ] Confirm hamburger + breadcrumb separator unaffected

### Phase 4 — Ship
- [ ] Commit and push to `origin/main`

### Execution Note
- [ ] Switch to **Execute mode**. First action: re-extract exact glyph code points (blank `content` in analysis must be resolved before writing CSS).
