Let me investigate the source styles and existing project conventions before finalizing the plan.Let me get the full arc SVG and check existing project blocks/conventions (especially whether a container/section-style approach exists).I have the source styles. Let me check the existing project conventions for sections/containers and design tokens before finalizing the plan.I have the source design details. There's a key architectural decision about how the "arc background container" should work in EDS, since EDS blocks can't natively nest other blocks the way the source AEM markup does. Let me clarify before finalizing.# Leadership Hero — Arc Background, Headline & Breadcrumb Blocks

## Goal
Recreate the top of the UPS leadership page in this EDS/Universal Editor project as three distinct, reusable pieces that match `https://about.ups.com/us/en/our-company/leadership.html`:
1. **Arc Background** — a grey-gradient section with the curved white arc at its bottom edge, acting as a visual container.
2. **Headline block** — the large centered page title.
3. **Breadcrumb block** — the Home / Our Company / Leadership trail.

> Execution requires **Execute mode**. This artifact is the plan only.

## Confirmed Decisions
- **Arc container = Section Style** (recommended). Authors add a Section, set its style to **"Arc Background"**, and place the Breadcrumb + Headline blocks inside it. Native EDS grouping; no fragile nested-block container. ✅
- **Breadcrumb = auto-generated from the page path** + page titles (Home / Our Company / Leadership derived from the URL hierarchy). ✅
- **Build all three** now: arc section style, Headline block, Breadcrumb block. ✅

## Exact Source Styles (captured from live page)
**Arc background wrapper** (`.background-normal-arc`):
- `background-image: linear-gradient(318.8deg, #dfdbd7 -11.42%, #f2f1ef 58.01%)`
- `padding-bottom: 135px`; `position: relative`
- Bottom arc via `::after`: an inline SVG (white curved path), `height: ~39–72px`, `position:absolute; bottom:0; left:0; width:100%`, `background-size:100%`. SVG path:
  `M-400 176C139.222 -24.794 1028.42 -10.941 1440 13.8751V176L-400 176Z` fill white.

**Headline `h1`:**
- `font-size: 64px`, `font-weight: 500`, `line-height: 80px`, `color: #242424`, `text-align: center`, `margin: 0 0 8px`
- Centered wrap, `col-lg-10 offset-lg-1` (≈83% width, centered)
- Note: project already has responsive `--heading-font-size-xxl` (64px desktop / 40px mobile) to reuse.

**Breadcrumb:**
- Links: `color: #5f5753`, `font-size: 14px`, `text-decoration: underline`
- Active (current page): `color: #5f5753`, `14px`, not underlined
- Separator: ` / ` between items

## Architecture in EDS/UE
- **Arc Background (section style):** add `"Arc Background"` (value `arc-background`) to `models/_section.json` style options; implement `.section.arc-background` CSS in `styles/styles.css` (gradient + `::after` SVG arc + bottom padding). The section's existing `.section > div` content wrapper holds the child blocks.
- **Headline block** (`blocks/headline/`): single block, one rich/title field; renders centered `h1` with the 64px style. Registered in section filter.
- **Breadcrumb block** (`blocks/breadcrumb/`): auto-builds the trail from `window.location.pathname`, mapping each segment to a link; last segment = active (no link). Labels from segment-to-title lookup (e.g. fetch each ancestor's title, or title-case the slug as fallback). Registered in section filter.

## Open Items / Risks
- **Breadcrumb labels:** auto-from-path gives links easily, but human labels ("Our Company" vs "our-company") need a source. Plan: try fetching each ancestor page's title (`<slug>.plain.html` metadata) and fall back to title-cased slug. The `/content/about-ups-eds/us/en/` → `/` path mapping must be respected so links resolve to clean URLs.
- **Arc SVG scaling:** the arc is a fixed-viewBox SVG stretched to full width; verify it scales cleanly at desktop/mobile without clipping the headline.
- **Section style is page-authored:** since UE reads from AEM author, the section + style + child blocks are applied in UE; local files are only for code/preview.
- **Reusability:** Headline and Breadcrumb become general-purpose blocks usable on any page, not just leadership.

## Checklist

### Phase 1 — Confirm Source & Conventions
- [x] Capture arc gradient, arc SVG path, and bottom padding
- [x] Capture headline h1 typography + centered wrap
- [x] Capture breadcrumb link/active styles + separator
- [ ] Confirm clean-URL mapping for breadcrumb ancestor links (`/our-company`, `/home`)
- [ ] Decide breadcrumb label source (ancestor page title vs title-cased slug)

### Phase 2 — Arc Background Section Style
- [ ] Add `Arc Background` option (value `arc-background`) to `models/_section.json` style multiselect
- [ ] Implement `.section.arc-background` in `styles/styles.css`: gradient bg, bottom padding, `::after` inline-SVG arc
- [ ] Verify arc scales full-width across breakpoints

### Phase 3 — Headline Block
- [ ] Create `blocks/headline/` (`_headline.json`, `.js`, `.css`)
- [ ] Model: single title/heading field; render centered `h1`
- [ ] CSS: 64px/80px, weight 500, `#242424`, centered, responsive down to mobile
- [ ] Add `headline` to section filter (`_section.json`)

### Phase 4 — Breadcrumb Block
- [ ] Create `blocks/breadcrumb/` (`_breadcrumb.json`, `.js`, `.css`)
- [ ] JS: build trail from `window.location.pathname`; last = active (no link); resolve labels (ancestor title → fallback title-case)
- [ ] CSS: 14px links `#5f5753` underlined, active not underlined, ` / ` separators
- [ ] Add `breadcrumb` to section filter (`_section.json`)

### Phase 5 — Register, Validate, Assemble
- [ ] Rebuild merged `component-definition/models/filters.json`
- [ ] `npm run lint` (JS + CSS) and validate UE model schema
- [ ] In UE: add a Section, set style **Arc Background**, place **Breadcrumb** + **Headline** inside, above the existing leadership list
- [ ] Visually compare against source (arc curve, gradient, headline size, breadcrumb)

### Execution Note
- [ ] Switch to **Execute mode** to implement Phases 2–5 (code) and then author the section in Universal Editor.
