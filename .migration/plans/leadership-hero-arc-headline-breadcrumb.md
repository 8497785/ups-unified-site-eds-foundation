# Leadership Hero — Arc Background, Headline & Breadcrumb Blocks

## Goal
Recreate the top of the UPS leadership page in this EDS/Universal Editor project as three reusable pieces matching `https://about.ups.com/us/en/our-company/leadership.html`:
1. **Arc Background** — grey-gradient section with the curved white arc at its bottom edge, acting as a visual container.
2. **Headline block** — the large centered page title.
3. **Breadcrumb block** — the Home / Our Company / Leadership trail.

> **Execution status:** Implementation has begun (todo list created) but writes are currently blocked by plan mode. Re-enter **Execute mode** to apply Phases 2–5.

## Confirmed Decisions
- **Arc container = Section Style.** Authors add a Section, set style **"Arc Background"**, and place Breadcrumb + Headline inside it. ✅
- **Breadcrumb = auto-generated from the page path** + page titles. ✅
- **Build all three** now. ✅

## Exact CSS — Provided by User (source of truth for the arc)
Adapt to EDS section class `.section.arc-background`:

```css
.section.arc-background {
  position: relative;
  z-index: 0;
  padding-bottom: 135px;
  background: linear-gradient(318.8deg, #dfdbd7 -11.42%, #f2f1ef 58.01%);
}

.section.arc-background::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: auto;
  padding-top: calc(5%);
  padding-bottom: 0;
  background-image: url("data:image/svg+xml,%3Csvg%20width%3d%271440%27%20class%3d%27arc%27%20height%3d%2772%27%20viewBox%3d%270%200%201440%2072%27%20fill%3d%27none%27%20xmlns%3d%27http%3a%2f%2fwww.w3.org%2f2000%2fsvg%27%3E%3Cpath%20d%3d%27M-400%20176C139.222%20-24.794%201028.42%20-10.941%201440%2013.8751V176L-400%20176Z%27%20fill%3d%27white%27%3E%3C%2fpath%3E%3C%2fsvg%3E");
  background-repeat: no-repeat;
  background-size: 100%;
  background-color: transparent;
  z-index: -1;
}
```

## Other Captured Styles
**Headline `h1`:** `64px / 80px`, weight `500`, `#242424`, `text-align:center`, `margin:0 0 8px`; centered wrap ≈83%. Reuse `--heading-font-size-xxl` (64px desktop / 40px mobile).
**Breadcrumb:** links `#5f5753`, `14px`, underlined; active `#5f5753`, `14px`, not underlined; ` / ` separators.

## Resolved Open Items
- **Clean-URL mapping (`paths.json`):** `home → /`, `/content/about-ups-eds/us/en/ → /`. Breadcrumb links: Home → `/`, Our Company → `/our-company`, current → no link. Leadership = `/our-company/leadership`.
- **Breadcrumb labels:** ancestor page title, with **title-cased slug fallback** (`our-company` → "Our Company").

## Architecture in EDS/UE
- **Arc Background (section style):** add `"Arc Background"` (value `arc-background`) to `models/_section.json`; add the CSS above to `styles/styles.css`.
- **Headline block** (`blocks/headline/`): single title field → centered `h1` at 64px. Registered in section filter.
- **Breadcrumb block** (`blocks/breadcrumb/`): builds trail from `window.location.pathname`; clean links per `paths.json`; last = active; labels from ancestor title → title-case fallback. Registered in section filter.

## Risks
- **`z-index:-1` arc stacking:** verify the arc stays visible within the EDS `main`/`.section` context (body/section background must not occlude it).
- **Seam into next section:** the 135px bottom padding + white arc must blend into the following white leadership-list section.
- **Section style is page-authored in UE** (reads from AEM author); local files are code/preview only.

## Checklist

### Phase 1 — Confirm Source & Conventions
- [x] Receive exact arc CSS, gradient, SVG path, padding
- [x] Capture headline h1 typography + centered wrap
- [x] Capture breadcrumb link/active styles + separator
- [x] Confirm clean-URL mapping (`paths.json`)
- [x] Confirm breadcrumb label source (ancestor title → title-cased slug fallback)

### Phase 2 — Arc Background Section Style
- [ ] Add `Arc Background` option (value `arc-background`) to `models/_section.json`
- [ ] Add user-provided `.section.arc-background` + `::after` CSS to `styles/styles.css`
- [ ] Verify arc visibility/stacking and full-width scaling across breakpoints
- [ ] Verify seam blends into the following white section

### Phase 3 — Headline Block
- [ ] Create `blocks/headline/` (`_headline.json`, `.js`, `.css`)
- [ ] Model: single title field; render centered `h1`
- [ ] CSS: 64px/80px, weight 500, `#242424`, centered, responsive to mobile
- [ ] Add `headline` to section filter

### Phase 4 — Breadcrumb Block
- [ ] Create `blocks/breadcrumb/` (`_breadcrumb.json`, `.js`, `.css`)
- [ ] JS: build trail from `window.location.pathname`; clean links per `paths.json`; last = active; labels (ancestor title → title-case fallback)
- [ ] CSS: 14px links `#5f5753` underlined, active not underlined, ` / ` separators
- [ ] Add `breadcrumb` to section filter

### Phase 5 — Register, Validate, Assemble
- [ ] Rebuild merged `component-definition/models/filters.json`
- [ ] `npm run lint` (JS + CSS) and validate UE model schema
- [ ] In UE: add a Section, set style **Arc Background**, place **Breadcrumb** + **Headline** above the leadership list
- [ ] Visually compare against source (arc curve, gradient, headline size, breadcrumb)

### Execution Note
- [ ] Re-enter **Execute mode** to apply Phases 2–5 (the first edit — adding the `Arc Background` option to `_section.json` — was attempted and blocked by plan mode).
