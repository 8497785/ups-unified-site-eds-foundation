Let me review the current container/content-width setup in the project before planning.I have a clear picture: the project uses a single fixed `--content-max-width: 1200px` applied at `main > .section > div` (line 286), whereas the source uses a **responsive stepped width** (`696/936/1160/1220px`) via `.upspr-container`. Let me confirm one design decision before finalizing.# Responsive Content Width — Match Source Stepped Container

## Goal
Replace the project's single fixed content width (`1200px`) with the source site's **responsive stepped container** so body content renders at the same widths as `https://about.ups.com/us/en/our-company/leadership.html`. Apply it to the standard EDS section content wrapper only.

> Execution requires **Execute mode**. This artifact is the plan only.

## Source Behavior (from `.upspr-container`)
- Base: `width: 100%`, `padding: 0 20px`, centered (`margin: 0 auto`).
- Stepped widths by breakpoint:
  - ≥768px → `696px`
  - ≥992px → `936px`
  - ≥1200px → `1160px`
  - ≥1400px → `1220px`
- `.upspr-container p { margin-bottom: 32px; }` (paragraph rhythm).

## Current EDS Behavior (verified)
- `--content-max-width: 1200px` (single value, line 58).
- Applied at `main > .section > div { max-width: var(--content-max-width); margin: auto; padding: 0 var(--spacing-md); }` (line 286), with `padding: 0 var(--spacing-lg)` at ≥992px.
- Header/footer use their own `1440px`; several blocks set `max-width: unset` for full-bleed (hero, arc, columns-media) — these must stay full-bleed.

## Confirmed Decisions
- **Responsive stepped (match source)** widths. ✅
- **Scope: section content wrapper only** (`main > .section > div`). Blocks inside inherit; header/footer and full-bleed blocks untouched. ✅

## Design
Drive the stepped width through the existing `--content-max-width` variable at each breakpoint (so the one wrapper rule keeps using the var, and any block referencing it inherits responsive behavior). Match the source's 20px side padding.

### CSS changes (`styles/styles.css`)
1. **Base var + wrapper padding** — set base width to 100% behavior and 20px padding:
```css
:root { --content-max-width: 100%; }   /* base: full width within padding */

main > .section > div {
  max-width: var(--content-max-width);
  margin: auto;
  padding: 0 20px;            /* source uses 20px gutters */
}
```
2. **Stepped breakpoints** — raise the var at each step:
```css
@media (width >= 768px)  { :root { --content-max-width: 696px; } }
@media (width >= 992px)  { :root { --content-max-width: 936px; } }
@media (width >= 1200px) { :root { --content-max-width: 1160px; } }
@media (width >= 1400px) { :root { --content-max-width: 1220px; } }
```
3. **Remove/reconcile** the existing `@media (width >= 992px) { main > .section > div { padding: 0 var(--spacing-lg); } }` so padding stays the source's 20px (avoid conflicting gutter).

## Risks / Notes
- **Var reuse side-effects:** changing `--content-max-width` responsively also affects any block reading it (`blocks/hero/hero.css:13` uses `1200px` literal, not the var — unaffected; but audit any var consumers). Plan: grep for `var(--content-max-width)` and confirm only the section wrapper consumes it; if others do, decide per-case.
- **Full-bleed blocks:** hero, hero-featured, hero-stats, columns-media, arc-background set `max-width: unset` / full width — must remain full-bleed; verify they don't regress.
- **Header/footer (1440px):** out of scope, unchanged.
- **Padding step removal:** ensure removing the 992px `--spacing-lg` padding override doesn't leave content edge-tight elsewhere; 20px matches source.
- **Existing 1200px fixed value:** superseded by stepped scale; max width becomes 1220px at ≥1400px (slightly wider than today at large screens — intended, matches source).

## Checklist

### Phase 1 — Implement
- [ ] Grep all `var(--content-max-width)` consumers; confirm scope is the section wrapper only
- [ ] Set base `--content-max-width: 100%` and stepped values at 768/992/1200/1400 breakpoints in `:root`
- [ ] Update `main > .section > div` to `padding: 0 20px`; remove the conflicting 992px padding override
- [ ] Leave header/footer (1440px) and full-bleed blocks (`max-width: unset`) untouched

### Phase 2 — Validate
- [ ] `npm run lint` (CSS) passes
- [ ] Verify content width at each breakpoint matches source (696/936/1160/1220) with 20px gutters
- [ ] Confirm hero/arc/columns-media remain full-bleed; header/footer unchanged
- [ ] Spot-check leadership listing + a bio page layout

### Phase 3 — Ship
- [ ] Commit and push to `origin/main`

### Execution Note
- [ ] Switch to **Execute mode** to implement Phases 1–3. First step audits `--content-max-width` consumers to avoid unintended width changes in other blocks.
