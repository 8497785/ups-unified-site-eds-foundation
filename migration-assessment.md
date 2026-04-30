# About UPS Homepage - AEM Edge Delivery Services Migration Assessment

## Source Page: https://about.ups.com/us/en/home.html
## Target: AEM EDS (XWalk/Crosswalk) — Universal Editor Compatible
## Date: 2026-04-30

---

# OUTPUT 1: Migration Assessment

## Page Structure Summary

The About UPS homepage consists of the following major sections (top to bottom):

1. **Global Header** — Fixed navigation with logo, search, mega-menu dropdowns
2. **Hero Section** — Full-width featured story with background image, category tag, headline, description, CTA
3. **Story Grid** — 3-column card grid with featured stories (image, category, headline, description)
4. **About Us Band** — Centered text section with category label, headline, description, CTA
5. **Stats/Facts Section** — Background image with 4 key statistics + CTA
6. **Impact Section** — Two-column layout (image + text content with category, headline, description, CTA)
7. **Global Footer** — Multi-column footer with links, social icons, legal, subscribe

## Migration Assessment Table

| Source Section/Component | Current AEM Behavior | Recommended EDS Block | Universal Editor Authoring Model | Styling Complexity | JavaScript Complexity | Asset Dependency | Analytics Dependency | SEO Dependency | Accessibility Notes | Migration Risk | Manual Review Required |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Global Header | Experience Fragment with mega-menu, search, responsive collapse | `header` (fragment-based) | Fragment reference to `/nav` | High — custom brand styling, dropdowns, search | High — mega-menu JS, search overlay, responsive toggle | UPS logo SVG from DAM | Tealium link tracking on all nav items | Navigation links critical for crawling | ARIA labels on dropdowns, keyboard nav | High | Yes |
| Hero/Featured Story | AEM component with responsive `<picture>` element, category tag, H4 headline, description, pill CTA | `hero` | image, imageAlt, categoryTag, heading, description, ctaText, ctaLink | High — full-width, responsive images at 3 breakpoints | Low — static content | 3 responsive image variants from DAM | CTA click tracking (`upspr-analytics` class) | H1 on page, primary content signal | Image alt text present | Medium | Yes |
| H1 Tagline | Large H1 text "Moving our world forward..." | Default content (H1 in section) | title component | Low | None | None | None | Primary H1 — critical | Proper heading hierarchy | Low | No |
| Story Cards Grid (3 cards) | Custom tile component with image, category tag, H3 headline, description | `cards` (variant: story-cards) | image, imageAlt, categoryTag, heading, description, link | Medium — card layout, hover states | Low — link behavior | Card images from DAM (380x280) | Link tracking on cards | Internal links for crawlability | Image alt text, link context | Medium | No |
| "View All Stories" CTA | Secondary button style linking to all-stories | Default content (button) | button component | Low — uses existing button style | None | None | CTA tracking | Internal link | Accessible button name | Low | No |
| About Us Band | Centered section with H4 label, H2 headline, secondary CTA | `columns` or default content section | title, text, button | Low — centered text, simple layout | None | None | CTA tracking | H2 heading | Heading hierarchy | Low | No |
| Stats/Facts Band | Background image with 4 stat items (H4 number + label) + CTA | `stats-band` (new block) | backgroundImage, stats[]{value, label}, ctaText, ctaLink | High — overlay on image, responsive layout | Low | Background image from DAM (responsive) | CTA tracking | Supports brand authority signals | Semantic list structure | Medium | Yes |
| Impact Section | Two-column card (image left, text right) with category, H2, paragraph, CTA | `media-card` (new block) | image, imageAlt, categoryTag, heading, description, ctaText, ctaLink | Medium — two-column responsive | Low | Image from DAM | CTA tracking | H2 heading, internal links | Image alt text | Medium | No |
| Global Footer | Experience Fragment with multi-column links, social icons, legal, subscribe/unsubscribe | `footer` (fragment-based) | Fragment reference to `/footer` | High — multi-column, responsive collapse | Medium — subscribe modal, cookie settings JS | Social icons, UPS brand assets | Outbound link tracking | Footer links for crawling | Social link titles present | High | Yes |
| Cookie Consent Banner | OneTrust SDK banner | External script integration | N/A — third-party | Low — OneTrust handles styling | N/A — OneTrust SDK | OneTrust logo | Consent state affects analytics | None | Dialog accessibility handled by OneTrust | Low | Yes |

---

# OUTPUT 2: EDS Block Model

## Block 1: Hero

| Property | Value |
|---|---|
| **Block name** | `hero` |
| **Purpose** | Full-width featured story hero with responsive background image, category tag, headline, description, and CTA |
| **Source section mapped** | Hero/Featured Story section |
| **Content fields** | image (reference), imageTablet (reference), imageMobile (reference), imageAlt (text), categoryTag (text), categoryLink (URL), heading (text), description (text), ctaText (text), ctaLink (URL) |
| **Authoring fields for UE** | image, imageAlt, categoryTag, categoryLink, heading, description, ctaText, ctaLink |
| **Required CSS file** | `blocks/hero/hero.css` |
| **Required JS file** | `blocks/hero/hero.js` (for responsive image handling) |
| **Variation support** | `hero (featured-story)` — with category tag and read-more CTA |
| **Responsive behavior** | Full-width at all breakpoints; image swaps at 768px and 992px; text overlays image on desktop, stacks below on mobile |
| **Analytics tagging needs** | CTA click tracking, category tag click tracking |
| **Acceptance criteria** | Hero renders full-width with correct responsive images; category tag links to category page; CTA is pill-shaped with UPS yellow (#FFC400); heading is H4; proper alt text on image |

## Block 2: Story Cards (Cards variant)

| Property | Value |
|---|---|
| **Block name** | `cards` (variant: `story-cards`) |
| **Purpose** | 3-column grid of story preview cards with image, category, headline, and description |
| **Source section mapped** | Story Grid section |
| **Content fields** | Per card: image (reference), imageAlt (text), categoryTag (text), categoryLink (URL), heading (text), description (text), link (URL) |
| **Authoring fields for UE** | Uses existing `card` model extended with categoryTag, categoryLink fields |
| **Required CSS file** | `blocks/cards/cards.css` |
| **Required JS file** | None |
| **Variation support** | `cards (story-cards)` — includes category tag pill above heading |
| **Responsive behavior** | 3 columns on desktop (≥992px), 2 columns on tablet (768-991px), 1 column stacked on mobile (<768px) |
| **Analytics tagging needs** | Card link click tracking with story title context |
| **Acceptance criteria** | Cards display in responsive grid; images are 380x280 aspect ratio; category tag appears as colored pill; hover state shows subtle elevation; entire card is clickable |

## Block 3: Stats Band

| Property | Value |
|---|---|
| **Block name** | `stats-band` |
| **Purpose** | Full-width section with background image and overlay statistics + CTA |
| **Source section mapped** | Stats/Facts section |
| **Content fields** | backgroundImage (reference), backgroundImageTablet (reference), backgroundImageMobile (reference), imageAlt (text), stats (repeatable: value + label), ctaText (text), ctaLink (URL) |
| **Authoring fields for UE** | backgroundImage, imageAlt, stats items (value, label), ctaText, ctaLink |
| **Required CSS file** | `blocks/stats-band/stats-band.css` |
| **Required JS file** | None |
| **Variation support** | None initially |
| **Responsive behavior** | Stats display horizontally on desktop, 2x2 grid on tablet, stacked vertically on mobile; background image changes per breakpoint |
| **Analytics tagging needs** | CTA click tracking |
| **Acceptance criteria** | Background image renders behind stats; stats show large numbers (H4) with labels; CTA is UPS yellow pill button; proper contrast for text readability |

## Block 4: Media Card

| Property | Value |
|---|---|
| **Block name** | `media-card` |
| **Purpose** | Two-column layout with image on one side and text content (category, heading, description, CTA) on the other |
| **Source section mapped** | Impact Section |
| **Content fields** | image (reference), imageAlt (text), categoryTag (text), categoryLink (URL), heading (text), description (text), ctaText (text), ctaLink (URL) |
| **Authoring fields for UE** | image, imageAlt, categoryTag, categoryLink, heading, description, ctaText, ctaLink |
| **Required CSS file** | `blocks/media-card/media-card.css` |
| **Required JS file** | None |
| **Variation support** | `media-card (image-left)`, `media-card (image-right)` |
| **Responsive behavior** | Side-by-side on desktop (≥992px), stacked on tablet/mobile |
| **Analytics tagging needs** | CTA click tracking, category link tracking |
| **Acceptance criteria** | Image and text display side-by-side on desktop; category tag is styled as category pill; CTA is secondary style (outlined); responsive stacking below 992px |

## Block 5: Header (Global)

| Property | Value |
|---|---|
| **Block name** | `header` |
| **Purpose** | Global site navigation with brand logo, mega-menu dropdowns, search, and utility links |
| **Source section mapped** | Global Header |
| **Content fields** | Loaded from `/nav` fragment: brand logo, nav sections with dropdowns, utility links |
| **Authoring fields for UE** | Fragment reference; nav content authored in `/nav` page |
| **Required CSS file** | `blocks/header/header.css` |
| **Required JS file** | `blocks/header/header.js` |
| **Variation support** | None — single global header |
| **Responsive behavior** | Full nav on desktop (≥992px); hamburger menu with slide-out on mobile/tablet |
| **Analytics tagging needs** | All nav link clicks tracked via Tealium |
| **Acceptance criteria** | Logo links to home; mega-menu dropdowns work on hover (desktop) and click (mobile); search icon toggles search overlay; sticky/fixed on mobile; accessible keyboard navigation |

## Block 6: Footer (Global)

| Property | Value |
|---|---|
| **Block name** | `footer` |
| **Purpose** | Global site footer with navigation columns, social links, legal links, subscribe CTA |
| **Source section mapped** | Global Footer |
| **Content fields** | Loaded from `/footer` fragment: columns of links, social icons, legal text, copyright |
| **Authoring fields for UE** | Fragment reference; footer content authored in `/footer` page |
| **Required CSS file** | `blocks/footer/footer.css` |
| **Required JS file** | `blocks/footer/footer.js` (subscribe modal) |
| **Variation support** | None — single global footer |
| **Responsive behavior** | Multi-column on desktop; stacked/accordion on mobile |
| **Analytics tagging needs** | Outbound link tracking, social link tracking, subscribe tracking |
| **Acceptance criteria** | All footer links render correctly; social icons display with proper titles; legal links include external indicators; copyright year is current; responsive collapse works |

---

# OUTPUT 3: Styling and Font Migration Plan

## Global Design Tokens

```css
:root {
  /* UPS Brand Colors */
  --ups-brown: #351c15;
  --ups-gold: #ffc400;
  --ups-dark: #242424;
  --ups-white: #ffffff;
  --ups-blue: #0662bb;
  --ups-light-gray: #f5f5f5;
  --ups-medium-gray: #97afd0;
  --ups-text-primary: #242424;
  --ups-text-secondary: rgba(0, 0, 0, 0.5);
  --ups-link-color: #0662bb;
  --ups-border-color: #dee2e6;

  /* Button Colors */
  --btn-primary-bg: #ffc400;
  --btn-primary-text: #121212;
  --btn-secondary-bg: #ffffff;
  --btn-secondary-text: #0662bb;
  --btn-secondary-border: #0662bb;

  /* Fonts */
  --body-font-family: 'Roboto', Tahoma, helvetica, arial, sans-serif;
  --heading-font-family: 'Roboto', 'Times New Roman', Times, serif;

  /* Body Sizes */
  --body-font-size-base: 16px;
  --body-font-size-sm: 14px;
  --body-font-size-lg: 18px;
  --body-line-height: 1.5;

  /* Heading Sizes (Desktop) */
  --heading-font-size-h1: 64px;
  --heading-font-size-h2: 40px;
  --heading-font-size-h3: 28px;
  --heading-font-size-h4: 40px;
  --heading-font-size-h5: 20px;
  --heading-font-size-h6: 16px;

  /* Heading Line Heights */
  --heading-line-height-h1: 80px;
  --heading-line-height-h2: 48px;
  --heading-line-height-h4: 60px;

  /* Font Weights */
  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-bold: 700;

  /* Spacing Scale */
  --spacing-xs: 8px;
  --spacing-sm: 16px;
  --spacing-md: 24px;
  --spacing-lg: 32px;
  --spacing-xl: 48px;
  --spacing-xxl: 64px;
  --spacing-section: 80px;

  /* Container Widths */
  --container-max-width: 1200px;
  --container-padding: 24px;
  --container-padding-desktop: 32px;

  /* Border Radius */
  --border-radius-button: 80px;
  --border-radius-card: 8px;
  --border-radius-tag: 16px;

  /* Nav Height */
  --nav-height: 72px;

  /* Breakpoints (for reference - used in media queries) */
  /* Mobile: < 576px */
  /* Tablet-sm: 576px - 767px */
  /* Tablet: 768px - 991px */
  /* Desktop: 992px - 1199px */
  /* Desktop-lg: ≥ 1200px */
  /* Desktop-xl: ≥ 1400px */
}
```

## Color Palette (Extracted from Source)

| Token | Hex | RGB | Usage |
|---|---|---|---|
| Primary Text | #242424 | rgb(36, 36, 36) | Body text, headings |
| Secondary Text | rgba(0,0,0,0.5) | — | Muted text, descriptions |
| Link Blue | #0662BB | rgb(6, 98, 187) | Links, secondary buttons |
| UPS Gold/Yellow | #FFC400 | rgb(255, 196, 0) | Primary CTA buttons |
| Button Text Dark | #121212 | rgb(18, 18, 18) | Text on yellow buttons |
| White | #FFFFFF | rgb(255, 255, 255) | Backgrounds, text on dark |
| Light Gray BG | #F5F5F5 | — | Section backgrounds |
| Header Overlay | rgba(151,175,208,0.55) | — | Hero/banner overlay effect |
| Footer Dark | #242424 | rgb(36, 36, 36) | Footer background areas |
| Body BG | #FFFFFF | rgb(255, 255, 255) | Page background |

## Font-Family Mapping

### Source Site Fonts
- **Body**: `Roboto, Tahoma, helvetica, arial, sans-serif`
- **Headings**: `Roboto, "Times New Roman", Times, serif`
- **Source**: Google Fonts CDN (`fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900`)

### EDS Project Fonts (Current)
- **Body**: `roboto, roboto-fallback, sans-serif` (self-hosted woff2)
- **Headings**: `roboto-condensed, roboto-condensed-fallback, sans-serif` (self-hosted woff2)

### FONT DEPENDENCY NOTE - CRITICAL

The source site uses **Roboto** from Google Fonts at weights 100, 300, 400, 500, 700, 900. The EDS project currently has self-hosted Roboto at weights 400, 500, 700 only.

**Discrepancies to resolve:**
1. The source site does NOT use Roboto Condensed for headings — it uses regular Roboto with medium weight (500). The EDS boilerplate's `roboto-condensed` heading font is INCORRECT for this migration.
2. The source heading font-family fallback stack is `"Times New Roman", Times, serif` — NOT `sans-serif`.
3. Missing font weights: 100 (thin), 300 (light), 900 (black) — verify if actually used on page.

**Required changes to `styles/fonts.css`:**
- Keep Roboto Regular (400), Medium (500), Bold (700)
- Update heading font to use Roboto (not Roboto Condensed) with weight 500
- Update fallback stacks to match source

## Heading Styles

| Level | Font Size | Line Height | Font Weight | Font Family |
|---|---|---|---|---|
| H1 | 64px | 80px (1.25) | 500 (medium) | Roboto, "Times New Roman", Times, serif |
| H2 | 40px | 48px (1.2) | 500 (medium) | Roboto, "Times New Roman", Times, serif |
| H3 | 28px | 36px (1.29) | 500 (medium) | Roboto, "Times New Roman", Times, serif |
| H4 | 40px | 60px (1.5) | 500 (medium) | Roboto, Tahoma, helvetica, arial, sans-serif |
| H5 | 20px | 28px (1.4) | 500 (medium) | Roboto, Tahoma, helvetica, arial, sans-serif |
| H6 | 16px | 24px (1.5) | 700 (bold) | Roboto, Tahoma, helvetica, arial, sans-serif |

## Body Copy Styles

| Element | Font Size | Line Height | Font Weight | Color |
|---|---|---|---|---|
| Body | 16px | 24px (1.5) | 400 | #242424 |
| Body Small | 14px | 20px | 400 | #242424 |
| Body Large | 18px | 28px | 400 | #242424 |
| Paragraph | 16px | 24px | 400 | #242424 |

## CTA/Button Styles

| Variant | Background | Text Color | Border | Border Radius | Padding | Font Weight | Font Size |
|---|---|---|---|---|---|---|---|
| Primary (Yellow) | #FFC400 | #121212 | none | 80px | 15px 32px | 700 | 16px |
| Secondary (Outlined) | #FFFFFF | #0662BB | 2px solid #0662BB | 80px | 15px 32px | 700 | 16px |
| Text Link | transparent | #0662BB | none | 0 | 0 | 700 | 16px |

## Link Styles
- **Default**: color `#0662BB`, text-decoration `underline`, font-weight `700`
- **Hover**: color `#0662BB`, text-decoration `underline`
- **Visited**: Same as default

## Card Styles
- **Border radius**: 8px
- **Image aspect ratio**: 380:280 (1.36:1)
- **Shadow**: subtle elevation on hover
- **Category tag**: uppercase, small font, colored pill

## Image Treatment
- **Hero images**: Full-width, object-fit cover, responsive srcset
- **Card images**: Fixed aspect ratio (380x280), border-radius top corners
- **Section images**: Contained within column, max-width 100%

## Grid/Container Widths
- **Max container**: 1200px (centered)
- **Padding**: 24px mobile, 32px desktop
- **Grid system**: 12-column Bootstrap-based (source), flexbox/grid in EDS

## Spacing Scale
- Section gaps: 80px desktop, 48px mobile
- Card gap: 24px
- Content internal padding: 24-32px

## Mobile/Tablet/Desktop Breakpoints

| Breakpoint | Width | Key Changes |
|---|---|---|
| Mobile | < 576px | Single column, hamburger menu, stacked layout |
| Tablet-sm | 576-767px | Minor width adjustments |
| Tablet | 768-991px | 2-column cards, tablet hero image |
| Desktop | 992-1199px | Full desktop layout, mega-menu |
| Desktop-lg | ≥ 1200px | Max-width container centered |
| Desktop-xl | ≥ 1400px | Extra spacing |

## CSS Files to Create/Update

| File | Purpose |
|---|---|
| `styles/styles.css` | Update design tokens, heading styles, button styles to match UPS brand |
| `styles/fonts.css` | Update font declarations — remove Roboto Condensed heading, add proper fallbacks |
| `blocks/hero/hero.css` | Rewrite for featured-story variant with category tag and responsive images |
| `blocks/hero/hero.js` | Add responsive image handling and category tag decoration |
| `blocks/cards/cards.css` | Add story-cards variant with category tags and grid layout |
| `blocks/stats-band/stats-band.css` | New — stats overlay on background image |
| `blocks/media-card/media-card.css` | New — two-column media + text layout |
| `blocks/header/header.css` | Major rewrite for UPS mega-menu navigation |
| `blocks/header/header.js` | Major rewrite for mega-menu, search, mobile slide-out |
| `blocks/footer/footer.css` | Rewrite for UPS multi-column footer with social icons |
| `blocks/footer/footer.js` | Add subscribe modal functionality |

---

# OUTPUT 4: EDS Implementation

(See generated files in the repository — implementation details below)

## Page Content Structure: `/us/en/home`

The homepage will use the following section structure:

```
Section 1: Hero (featured story)
Section 2: Story Cards Grid + View All CTA
Section 3: About Us Band (default content)
Section 4: Stats Band
Section 5: Impact Media Card
```

## Implementation Notes

- Header and Footer are loaded as fragments from `/nav` and `/footer` respectively
- The page uses the standard EDS section-based layout
- Each block has its own CSS and optional JS in `blocks/{name}/`
- Universal Editor models are defined in `component-models.json`
- Block definitions are in `component-definition.json`
- Block filter rules are in `component-filters.json`

---

# OUTPUT 5: Asset Handling

## Asset Inventory

| Asset | Source URL | Type | Source System | Alt Text | Dimensions | Migration Action |
|---|---|---|---|---|---|---|
| UPS Logo (SVG) | /content/dam/upsstories/images/logo/ups-logo-wo-text.svg | SVG | AEM DAM | "UPS Stories Logo" | 56x67 | Download and host in /icons/ or /images/ |
| Hero Desktop Image | /content/dam/upsstories/images/our-stories/innovation-driven/top-6-takeaways-from-upss-q1-2026-earnings-announcement/6things1Q26-1440x752-FEATURE.jpg | JPEG | AEM DAM | "1956949830" (needs fix) | 1440x752 | Migrate to EDS DAM |
| Hero Tablet Image | /content/dam/upsstories/images/our-stories/innovation-driven/.../6things1Q26-1023x960.jpg | JPEG | AEM DAM | Same | 1023x960 | Migrate to EDS DAM |
| Hero Mobile Image | /content/dam/upsstories/images/our-stories/innovation-driven/.../6things1Q26-380x280.jpg | JPEG | AEM DAM | Same | 380x280 | Migrate to EDS DAM |
| Story Card 1 Image | /content/dam/upsstories/images/our-stories/customer-first/the-largest-box-free-label-free-return-network/happyreturns-sizes-380x280.jpg | JPEG | AEM DAM | "The largest box-free..." | 380x280 | Migrate to EDS DAM |
| Story Card 2 Image | /content/dam/upsstories/images/our-stories/customer-first/meet-the-finalists.../aboutthumbnail-380x280-smallbizchallenge.jpg | JPEG | AEM DAM | "Meet the winner..." | 380x280 | Migrate to EDS DAM |
| Story Card 3 Image | /content/dam/upsstories/images/our-stories/customer-first/ups-x-fanatics.../TitleRun-Ep2-Cadeau-380x280.jpg | JPEG | AEM DAM | "Michigan Wolverines..." | 380x280 | Migrate to EDS DAM |
| Stats BG Desktop | /content/dam/upsstories/images/bus-image.jpg | JPEG | AEM DAM | "Fact Page" (needs fix) | Unknown | Migrate to EDS DAM |
| Stats BG Tablet | /content/dam/upsstories/images/bus-image-tab.png | PNG | AEM DAM | Same | Unknown | Migrate to EDS DAM |
| Stats BG Mobile | /content/dam/upsstories/images/bus-mobile-flip-2x.jpg | JPEG | AEM DAM | Same | Unknown | Migrate to EDS DAM |
| Impact Section Image | /content/dam/upsstories/images/delivering-what-matters_left.png | PNG | AEM DAM | "Every day, around the globe..." | 590x548 | Migrate to EDS DAM |
| Social Share Logo | /content/dam/upsstories/images/logo/ups-social-share-logo.jpg | JPEG | AEM DAM | OG image | Unknown | Migrate for metadata |

## Asset Issues Flagged

| Issue | Asset | Action Required |
|---|---|---|
| Poor alt text | Hero image — alt is "1956949830" (numeric ID) | Replace with descriptive alt text |
| Poor alt text | Stats BG — alt is "Fact Page" | Replace with descriptive alt text or mark decorative |
| Dynamic content | Hero image changes with featured story | Ensure authoring model supports image updates |
| External tracking pixels | id.rlcdn.com/464526.gif (1x1 pixel) | Do not migrate — analytics/tracking artifact |
| Licensed brand assets | UPS logo SVG | Verify rights for EDS hosting |
| No video content | N/A | No video migration needed |

## Asset Delivery Recommendations
- Use AEM as a Cloud Service DAM with EDS delivery for all images
- Implement `<picture>` elements with responsive `<source>` for hero/stats images
- Use WebP format where possible with JPEG fallback
- Avoid hardcoding author-tier URLs (`author-p*`) in content
- Use relative paths or delivery-tier URLs for all assets

---

# OUTPUT 6: SEO Preservation

## SEO Elements Comparison

| Element | Source Value | EDS Target | Status |
|---|---|---|---|
| Page Title | "Home \| About UPS" | Preserve exact title | Required |
| Meta Description | "Get the latest UPS® stories and news. Learn how we are customer first, people led and innovation driven. Find UPS company information, our social impact and media resources." | Preserve exact description | Required |
| Canonical URL | https://about.ups.com/us/en/home.html | Must map to new EDS URL or preserve | Critical |
| Robots | index,follow | Preserve | Required |
| Keywords | "Pages,All Countries" | Preserve (low SEO value but maintain parity) | Optional |
| OG Site Name | "About UPS-US" | Preserve | Required |
| OG Type | "Article" | Preserve | Required |
| OG URL | /us/en/home | Preserve | Required |
| OG Title | "Home \| About UPS" | Preserve | Required |
| OG Description | Same as meta description | Preserve | Required |
| OG Image | https://about.ups.com/content/dam/upsstories/images/logo/ups-social-share-logo.jpg | Migrate image, update URL | Required |
| Twitter Card | summary_large_image | Preserve | Required |
| Twitter Title | "Home \| About UPS" | Preserve | Required |
| Twitter Description | Same as meta description | Preserve | Required |
| Twitter URL | https://about.ups.com/us/en/home.html | Update to EDS URL | Required |
| Twitter Image | Same as OG image | Preserve | Required |
| Google Site Verification | dQsclDeLPhSgzf5nsUcQTDAXPVV0qLhL2AzY2WP43pY | Preserve in head.html | Required |
| Hreflang | None present | N/A | — |
| Structured Data (JSON-LD) | None present | Consider adding Organization schema | Recommended |

## Heading Hierarchy

| Level | Content | SEO Role |
|---|---|---|
| H1 | "Moving our world forward by delivering what matters." | Primary page topic — single H1 ✓ |
| H2 | "Customer First, People Led, Innovation Driven" | Secondary topic |
| H2 | "Every day, around the globe, we are delivering what matters." | Secondary topic |
| H3 | Story card headings (3x) | Supporting content |
| H4 | "INNOVATION DRIVEN" (hero category) | Category label |
| H4 | "ABOUT US" | Section label |
| H4 | Stats values (~460K, 200+, 20.8M, $88.7B) | Data points |

## Internal Links (Preserve)
- /us/en/our-stories/innovation-driven.html
- /us/en/our-stories/customer-first.html
- /us/en/our-stories/innovation-driven/top-6-takeaways-from-ups-s-q1-2026-earnings-announcement.html
- /us/en/our-stories/customer-first/the-largest-box-free--label-free-return-network-in-the-u-s--is-b.html
- /us/en/our-stories/customer-first/meet-the-finalists-of-the-ups-store-2026-small-biz-challenge.html
- /us/en/our-stories/customer-first/ups-x-fanatics-title-run-series.html
- /us/en/all-stories.html
- /us/en/our-company.html
- /us/en/our-company/global-presence.html
- /us/en/our-impact.html

## External Links (Preserve with tracking)
- https://investors.ups.com (and sub-pages)
- https://www.ups.com (shipping site)
- https://www.jobs-ups.com (via DoubleClick redirect)
- https://brand.ups.com
- https://www.upsers.com
- Social media profiles (Facebook, X, Instagram, LinkedIn, YouTube)

## SEO Validation Checklist

- [ ] Page title matches source exactly
- [ ] Meta description matches source exactly  
- [ ] Canonical URL is correct and resolves
- [ ] Robots meta is index,follow
- [ ] Single H1 element on page
- [ ] Heading hierarchy is logical (H1 > H2 > H3)
- [ ] All OG tags present and correct
- [ ] All Twitter Card tags present and correct
- [ ] OG image URL resolves and returns correct image
- [ ] Google Site Verification meta tag preserved
- [ ] All internal links use correct paths
- [ ] All external links open correctly
- [ ] No broken links (404s)
- [ ] No redirect chains introduced
- [ ] Page loads within 3 seconds (Core Web Vitals)
- [ ] No content hidden from crawlers
- [ ] Image alt text preserved for all content images
- [ ] Schema.org Organization markup added (enhancement)

---

# OUTPUT 7: Analytics and Tagging Preservation

## Analytics Stack (Source)

| System | Implementation | Script URL |
|---|---|---|
| Tealium IQ (Tag Manager) | Primary tag management | tags.tiqcdn.com/utag/ups/ups-stories/prod/utag.js |
| Tealium Sync | Synchronous tags | tags.tiqcdn.com/utag/ups/ups-stories/prod/utag.sync.js |
| OneTrust (Consent) | Cookie consent management | cdn.cookielaw.org/scripttemplates/otSDKStub.js |
| Qualtrics | Site intercept surveys | zndpzhr48cpi7bkes-upscx.siteintercept.qualtrics.com |
| Demandbase | B2B analytics/personalization | scripts.demandbase.com/DZlgJRFL.min.js |
| BlueConic | Customer data platform | aap-p.ups.com/script.js |
| Akamai mPulse (RUM) | Real user monitoring | s.go-mpulse.net/boomerang/... |
| Adobe Helix RUM | EDS performance monitoring | about.ups.com/.rum/@adobe/helix-rum-js |
| LiveRamp | Identity resolution (pixel) | id.rlcdn.com/464526.gif |

## Tealium Data Layer (utag_data)

Key variables that must be preserved:

| Variable | Value | Purpose |
|---|---|---|
| page_country_code | "us" | Geographic targeting |
| page_language | "en" | Language targeting |
| page_id | "us/en/home.html" | Page identification |
| site_area | "home" | Site section tracking |
| site_sub_area | "home" | Sub-section tracking |
| brand_name | "stories.ups.com" | Brand attribution |
| new_page_name | "about:us:en:home" | Analytics page name |
| tealium_account | "ups" | Tealium account |
| tealium_profile | "ups-stories" | Tealium profile |
| tealium_environment | "prod" | Environment flag |
| clean_URL | "https://about.ups.com/us/en/home.html" | Clean URL for reporting |

## Consent Categories (OneTrust)

| Category | ID | Purpose |
|---|---|---|
| Strictly Necessary | C0001 | Essential cookies |
| Analytics | C0004 | Performance/analytics |
| Personalization | C0005 | Functional cookies |
| Targeting | C0008 | Advertising cookies |
| Social Media | C0009 | Social sharing |

## CTA/Link Tracking

Source uses class `upspr-analytics` on CTAs for tracking. EDS implementation must preserve:

- Click event tracking on all CTAs
- Link text context for reporting
- Destination URL capture
- Category/section context

## Analytics Migration Requirements

| Requirement | Priority | Implementation |
|---|---|---|
| Tealium utag.js integration | Critical | Add to `scripts/delayed.js` |
| utag_data layer population | Critical | Populate before utag fires |
| OneTrust consent integration | Critical | Load before Tealium |
| Page view tracking | Critical | Fire on initial load |
| CTA click tracking | High | Data attributes or event listeners |
| Nav link tracking | High | Event delegation on header |
| Demandbase integration | Medium | Load via Tealium |
| Qualtrics intercept | Medium | Load via Tealium |
| BlueConic CDP | Medium | Load via delayed.js |
| Akamai mPulse RUM | Low | Separate from EDS RUM |

## Analytics Validation Checklist

- [ ] Tealium utag.js loads successfully on EDS page
- [ ] utag_data object populated with correct values before utag fires
- [ ] OneTrust banner appears and consent state is captured
- [ ] Page view event fires with correct page_name
- [ ] CTA clicks generate tracking events with correct context
- [ ] Nav clicks generate tracking events
- [ ] Footer link clicks are tracked
- [ ] Consent preferences properly gate tag firing
- [ ] No duplicate page views
- [ ] Data layer values match source page values
- [ ] Demandbase script loads (after consent)
- [ ] Qualtrics intercept loads (after consent)
- [ ] BlueConic integration works
- [ ] No JavaScript errors in console related to analytics
- [ ] RUM data flows correctly for EDS monitoring

---

# OUTPUT 8: Accessibility Validation

## Current Accessibility Assessment

| Element | Source Behavior | Status | EDS Requirement |
|---|---|---|---|
| Semantic H1 | Single H1: "Moving our world forward..." | ✓ Good | Preserve single H1 |
| Heading hierarchy | H1 > H2 > H3 > H4 — mostly logical but H4 used for stats | ⚠️ Mixed | Clean up H4 usage for stats (use `<span>` or `<strong>`) |
| Image alt text | Present on all content images | ⚠️ Some poor (numeric IDs) | Fix alt text quality |
| Nav keyboard access | Dropdown menus with button triggers | ✓ Present | Implement full keyboard nav |
| Skip links | Not observed | ❌ Missing | Add skip-to-content link |
| ARIA labels | "Open navigation" on hamburger | ✓ Present | Preserve and extend |
| Focus indicators | Browser defaults + custom | ⚠️ Verify | Ensure visible focus rings |
| Color contrast | Dark text on white (good), white text on images (variable) | ⚠️ Verify overlays | Add semi-transparent overlay on hero for text readability |
| Social links | `title` attributes present (Facebook, X, Instagram, LinkedIn, YouTube) | ✓ Good | Preserve title/aria-label |
| Form controls | Search input with label | ✓ Present | Ensure proper label association |
| Cookie banner | Dialog with heading, buttons | ✓ Good | OneTrust handles this |
| Footer links | External links marked "Open in new window" | ✓ Good | Preserve external indicators |
| Language | `lang="en"` on HTML | ✓ Present | Preserve |
| Landmark regions | header, nav, main (implied), footer | ⚠️ Verify | Ensure proper landmarks |

## Accessibility Gaps to Remediate

| Gap | Severity | Remediation |
|---|---|---|
| No skip link | Medium | Add `<a class="skip-link" href="#main">Skip to main content</a>` |
| Hero image alt text is numeric ID "1956949830" | High | Replace with descriptive text matching story headline |
| Stats band background image alt "Fact Page" is non-descriptive | Low | Mark as decorative (alt="") since stats provide the content |
| Social links use only `title` (not `aria-label`) | Low | Add `aria-label` for screen readers |
| Heading hierarchy: H4 used for large stat numbers | Medium | Consider using `<span>` with aria for stat values, not heading elements |
| Category tags ("INNOVATION DRIVEN") are H4 | Medium | Consider using `<span>` or lower heading to fix hierarchy |
| External links should indicate opening in new window | Medium | Add `aria-label` or visible indicator for new-window links |
| Focus trap on search overlay not verified | Medium | Ensure search overlay traps and returns focus |

## Accessibility Compliance Checklist

- [ ] Single H1 per page
- [ ] Logical heading hierarchy (no skipped levels)
- [ ] All images have appropriate alt text (or alt="" for decorative)
- [ ] All interactive elements keyboard accessible
- [ ] Visible focus indicators on all focusable elements
- [ ] Skip-to-content link present and functional
- [ ] ARIA labels on icon-only buttons/links
- [ ] Color contrast ≥ 4.5:1 for normal text, ≥ 3:1 for large text
- [ ] No content conveyed by color alone
- [ ] Language attribute on HTML element
- [ ] Proper landmark regions (header, nav, main, footer)
- [ ] External links indicated (visually + for assistive tech)
- [ ] Form inputs have associated labels
- [ ] Error states clearly communicated
- [ ] No keyboard traps
- [ ] Touch targets ≥ 44x44px on mobile
- [ ] Content reflows without horizontal scroll at 320px width
- [ ] Animations respect prefers-reduced-motion

---

# OUTPUT 9: Responsive Visual Parity

## Breakpoint Validation Matrix

### 1440px Desktop

| Section | Expected Behavior | Validation Notes |
|---|---|---|
| Header | Full mega-nav, logo left, nav center, search/utility right | Verify dropdown alignment |
| Hero | Full-width 1440x752 image, text overlay, CTA bottom-left | Check image scaling at >1440px |
| H1 Tagline | 64px font, centered or left-aligned | Verify max-width and centering |
| Story Cards | 3 columns, equal height, 380x280 images | Check gap spacing |
| About Band | Centered text, max-width container | Verify spacing |
| Stats Band | Full-width BG image, 4 stats horizontal, CTA | Check overlay readability |
| Impact | Two columns (image left, text right) | Verify 50/50 split |
| Footer | Multi-column layout (4 columns) | Check column alignment |

### 1024px Tablet (Landscape)

| Section | Expected Behavior | Validation Notes |
|---|---|---|
| Header | May still show full nav or begin collapsing | Verify breakpoint behavior |
| Hero | Tablet image (1023x960), adjusted text size | Check image swap |
| Story Cards | 3 columns still (slightly narrower) or 2+1 | Verify grid behavior |
| Stats Band | Tablet background image | Check stat layout |
| Impact | Still two-column but tighter | Verify spacing |
| Footer | 3-column or 2-column | Check reflow |

### 768px Tablet (Portrait)

| Section | Expected Behavior | Validation Notes |
|---|---|---|
| Header | Hamburger menu, logo only visible | Verify toggle works |
| Hero | Tablet image, text size reduced | Check readability |
| Story Cards | 2-column grid | Verify card sizing |
| About Band | Full-width centered | OK |
| Stats Band | 2x2 grid for stats | Check alignment |
| Impact | Stacked (image top, text bottom) | Verify stack order |
| Footer | 2-column or stacked | Check reflow |

### 390px Mobile (iPhone 14 Pro)

| Section | Expected Behavior | Validation Notes |
|---|---|---|
| Header | Hamburger, compact logo | Touch target size |
| Hero | Mobile image (380x280), reduced text | Check CTA visibility |
| H1 | Reduced font size (~36-40px) | Verify readability |
| Story Cards | Single column, full-width | Card image scaling |
| Stats Band | Mobile BG image, stacked stats | Check vertical layout |
| Impact | Stacked, image full-width | Image aspect ratio |
| Footer | Single column, all stacked | Verify spacing |

### 375px Mobile (iPhone SE/older)

| Section | Expected Behavior | Validation Notes |
|---|---|---|
| Header | Same as 390px | Touch targets |
| All sections | 15px less width than 390px | Check for overflow |
| CTAs | Full-width buttons on mobile | No horizontal overflow |
| Text | No text truncation | Verify wrapping |
| Images | Scale correctly | No distortion |

## Responsive Issues to Watch

| Issue | Risk | Mitigation |
|---|---|---|
| Hero text readability on dark images | High | Ensure semi-transparent overlay |
| Stats band text on complex background | High | Add dark overlay behind text |
| Card images maintaining aspect ratio | Medium | Use object-fit: cover with fixed aspect-ratio |
| Navigation mega-menu positioning | Medium | Test thoroughly at tablet breakpoints |
| Long headlines breaking layout | Medium | Add text-overflow handling |
| CTA button wrapping on narrow screens | Low | Allow full-width on mobile |
| Horizontal overflow from fixed-width elements | Medium | Audit all fixed widths |
| Footer link columns reflow | Low | Flexbox wrapping |

---

# OUTPUT 10: Visual Regression Acceptance Criteria

## Baseline: Source page at https://about.ups.com/us/en/home.html

### Desktop (1440px) Acceptance

- [ ] Header height and positioning matches source
- [ ] Logo size and placement correct
- [ ] Navigation link styling matches (font, color, weight)
- [ ] Hero image fills viewport width
- [ ] Hero text overlay positioned correctly
- [ ] Hero CTA is pill-shaped, UPS yellow (#FFC400)
- [ ] H1 font size 64px, weight 500, correct font family
- [ ] Story cards in 3-column grid with correct spacing
- [ ] Card images at 380x280 aspect ratio
- [ ] Category tags styled as pills with correct colors
- [ ] "View All Stories" button secondary style correct
- [ ] About Us section centered with correct spacing
- [ ] Stats band full-width with background image
- [ ] Stat numbers large (40px) with labels below
- [ ] Impact section two-column with correct proportions
- [ ] Footer multi-column with correct link styling
- [ ] Social icons display correctly
- [ ] No layout shifts during page load
- [ ] No broken images
- [ ] No console errors

### Mobile (390px) Acceptance

- [ ] Header collapses to hamburger menu
- [ ] Hamburger menu opens/closes correctly
- [ ] Hero uses mobile-optimized image
- [ ] Hero text is readable (reduced size)
- [ ] Story cards stack to single column
- [ ] Stats stack vertically
- [ ] Impact section stacks (image then text)
- [ ] Footer stacks to single column
- [ ] All CTAs full-width and tappable (44px+ touch target)
- [ ] No horizontal overflow
- [ ] No text cutoff

### Font Matching Criteria

- [ ] Body text uses Roboto Regular 400 at 16px
- [ ] Headings use Roboto Medium 500 (NOT Roboto Condensed)
- [ ] CTA buttons use Roboto Bold 700 at 16px
- [ ] No fallback font flash (FOUT) longer than 100ms
- [ ] Font files load from self-hosted path (not Google CDN)

### Color Matching Criteria

- [ ] Primary CTA background: #FFC400
- [ ] Primary CTA text: #121212
- [ ] Secondary CTA text: #0662BB
- [ ] Body text: #242424
- [ ] Link color: #0662BB
- [ ] Background: #FFFFFF
- [ ] No unexpected color differences in any section

### Performance Criteria

- [ ] LCP (Largest Contentful Paint) < 2.5s
- [ ] CLS (Cumulative Layout Shift) < 0.1
- [ ] FID (First Input Delay) < 100ms
- [ ] No render-blocking resources beyond critical CSS
- [ ] Images lazy-loaded below fold
- [ ] Font display swap prevents invisible text

### Functional Criteria

- [ ] All links navigate to correct destinations
- [ ] All CTAs are clickable and navigate correctly
- [ ] Search functionality works (if implemented)
- [ ] Cookie consent banner appears and functions
- [ ] Footer subscribe button triggers correct action
- [ ] External links open in new tab where appropriate

---

# OUTPUT 11: Manual Review Checklist

## Business Owner Review

- [ ] Brand voice and messaging preserved accurately
- [ ] "Moving our world forward by delivering what matters" tagline correct
- [ ] Company statistics accurate (~460K employees, 200+ countries, 20.8M packages/day, $88.7B revenue)
- [ ] Featured story is current and approved for display
- [ ] CTA destinations are correct and approved
- [ ] Footer legal text is current and approved
- [ ] Copyright year is correct (2026)
- [ ] No outdated content or messaging
- [ ] Newsletter subscribe functionality works per business requirements

## UX/Design Team Review

- [ ] Visual fidelity matches approved design/source
- [ ] Typography matches UPS brand guidelines
- [ ] Color palette matches UPS brand guidelines
- [ ] Button styles (pill shape, colors) match brand
- [ ] Card layout and spacing match source
- [ ] Hero section visual impact preserved
- [ ] Responsive behavior acceptable at all breakpoints
- [ ] Hover/interaction states appropriate
- [ ] No visual regressions from source
- [ ] White space and layout rhythm maintained

## SEO Team Review

- [ ] Page title preserved
- [ ] Meta description preserved
- [ ] Canonical URL correct and resolving
- [ ] OG/Twitter metadata complete
- [ ] H1 is unique and descriptive
- [ ] Heading hierarchy logical
- [ ] Internal links working and crawlable
- [ ] No noindex/nofollow accidentally applied
- [ ] Core Web Vitals acceptable
- [ ] No content hidden that was previously visible to crawlers
- [ ] Redirect from old URL to new URL configured (if URL changes)

## Analytics Team Review

- [ ] Tealium utag.js loading correctly
- [ ] utag_data populated with correct values
- [ ] Page view event fires with correct dimensions
- [ ] CTA click tracking functional
- [ ] Navigation click tracking functional
- [ ] OneTrust consent integration working
- [ ] Consent properly gates analytics tags
- [ ] No duplicate tracking events
- [ ] Data layer values consistent with source
- [ ] Campaign parameter passthrough working

## Accessibility Reviewer

- [ ] Keyboard navigation works throughout page
- [ ] Screen reader announces content correctly
- [ ] Skip link present and functional
- [ ] All images have appropriate alt text
- [ ] Color contrast meets WCAG 2.1 AA
- [ ] Focus indicators visible
- [ ] ARIA labels correct on interactive elements
- [ ] No keyboard traps
- [ ] Content accessible at 200% zoom
- [ ] Animations respect reduced-motion preference

## AEM/EDS Developer Review

- [ ] Block structure follows EDS conventions
- [ ] Component models are correct for Universal Editor
- [ ] No hardcoded content in JS/CSS
- [ ] CSS uses design tokens (custom properties)
- [ ] No CSS specificity conflicts
- [ ] JavaScript is modular and error-free
- [ ] Fragment loading works for header/footer
- [ ] No build errors or lint warnings
- [ ] Performance budget met
- [ ] Code is maintainable and documented

## Content Author Review

- [ ] Can edit hero section content in Universal Editor
- [ ] Can edit/reorder story cards
- [ ] Can update statistics values
- [ ] Can modify CTA text and links
- [ ] Can update About Us section text
- [ ] Can update Impact section content
- [ ] Preview matches published output
- [ ] No confusing authoring UI

## QA Team Review

- [ ] All functional tests pass
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Mobile device testing (iOS Safari, Android Chrome)
- [ ] No JavaScript console errors
- [ ] No 404 resources
- [ ] Form/search functionality works
- [ ] Cookie consent flow works end-to-end
- [ ] Performance meets thresholds
- [ ] Accessibility audit passes
- [ ] Visual regression within tolerance

## Security/CDN Reviewer

- [ ] CSP headers correct and not blocking required resources
- [ ] No mixed content (HTTP resources on HTTPS page)
- [ ] Third-party scripts from approved domains only
- [ ] No exposed internal URLs or author-tier references
- [ ] CDN cache rules appropriate
- [ ] No sensitive data in page source
- [ ] External script integrity verified
- [ ] CORS headers correct for asset delivery

---

# OUTPUT 12: Risks and Blockers

## Critical Risks

| # | Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|---|
| 1 | **Font discrepancy** — EDS boilerplate uses Roboto Condensed for headings but source uses regular Roboto with serif fallback | Visual mismatch on all headings | Certain | Update `styles/fonts.css` and `styles/styles.css` to match source font stack |
| 2 | **Header/navigation complexity** — Source uses complex mega-menu with 5 dropdown sections, each with 3-8 sub-items | Feature gap if simplified | High | Implement custom mega-menu in EDS header block; significant JS/CSS effort |
| 3 | **Analytics/Tealium dependency** — 9+ analytics vendors load via Tealium; migration must preserve data continuity | Analytics data gap during transition | High | Implement Tealium in `scripts/delayed.js`; validate data layer before go-live |
| 4 | **Dynamic content** — Hero and story cards display latest/featured content that changes frequently | Static migration quickly becomes stale | Certain | Implement authoring model that allows content authors to update via Universal Editor |
| 5 | **OneTrust consent dependency** — Analytics firing depends on consent state | Compliance risk if consent not working | Medium | Load OneTrust before Tealium; test consent flow |

## High Risks

| # | Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|---|
| 6 | **DAM asset migration** — All images reference AEM DAM paths (`/content/dam/upsstories/...`) | Broken images if paths not updated | Medium | Migrate assets to EDS-compatible delivery; update all references |
| 7 | **Footer subscribe/unsubscribe functionality** — Source has modal-based subscribe flow | Feature gap if not implemented | Medium | Implement or defer subscribe flow; link to external preference center as fallback |
| 8 | **Search functionality** — Source has search overlay with Coveo/custom implementation | Feature gap | Medium | Determine if search is required for homepage or can link to search page |
| 9 | **Responsive image delivery** — Source uses `<picture>` with multiple sources per breakpoint | Performance impact if not replicated | Medium | Implement responsive image handling in hero/stats blocks |
| 10 | **CDN/redirect dependency** — Source serves from Akamai CDN with specific caching rules | Cache invalidation issues during cutover | Medium | Coordinate with CDN team for cutover plan |

## Medium Risks

| # | Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|---|
| 11 | **Personalization (Demandbase/BlueConic)** — Source uses B2B personalization that may show different content to different visitors | Personalized experiences lost | Low | Document personalization rules; implement via Target/personalization layer later |
| 12 | **Qualtrics intercept surveys** — Source loads Qualtrics for site feedback | Survey data gap | Low | Add Qualtrics via delayed loading; verify targeting rules |
| 13 | **DoubleClick redirect for careers link** — Careers link goes through ad tracking redirect | Tracking attribution lost | Low | Preserve the redirect URL or implement equivalent tracking |
| 14 | **Cookie Settings JavaScript link** — Footer "Cookie Settings" uses `javascript:` URL | Won't work as static link | Medium | Implement as button with OneTrust API call |
| 15 | **Footer "Unsubscribe" button** — Inline button for email unsubscribe | Feature gap | Low | Link to external preference center |

## Blockers (Require Resolution Before Go-Live)

| # | Blocker | Owner | Resolution Path |
|---|---|---|---|
| B1 | Confirm font licensing — Roboto is open-source (Apache 2.0) so no licensing issue, but verify UPS brand team approves self-hosted Roboto in EDS | Brand/Legal | Get written confirmation |
| B2 | DAM asset migration plan — determine delivery tier URL pattern for images in EDS | Engineering/DAM team | Define asset URL strategy |
| B3 | Analytics team sign-off on data layer parity | Analytics team | Compare utag_data values between source and EDS |
| B4 | Header/footer content — determine if header/footer are shared globally or page-specific | Content architecture | Confirm fragment strategy for /nav and /footer |
| B5 | URL mapping — confirm if EDS page URL will match source or require redirect | SEO/Engineering | Define URL strategy and redirect plan |

## Components NOT Suitable for EDS (Keep in AEM or Handle Separately)

| Component | Reason | Recommendation |
|---|---|---|
| Search overlay with autocomplete | Complex interactive feature requiring backend API | Link to search page or implement as microfront-end |
| Newsletter subscribe modal | Requires backend integration for email system | Link to external subscription page |
| OneTrust consent management | Third-party SDK, not EDS-native | Load via script tag in head.html or delayed.js |
| Qualtrics survey intercept | Third-party SDK | Load via Tealium/delayed.js |
| Demandbase personalization | B2B CDP integration | Load via Tealium/delayed.js |

---

# OUTPUT 13: Final Migration Summary

## What Was Migrated Automatically (via this assessment)

| Item | Status | Notes |
|---|---|---|
| Page structure analysis | ✅ Complete | All sections identified and mapped |
| Block model design | ✅ Complete | 6 blocks defined with authoring models |
| Design token extraction | ✅ Complete | Colors, fonts, spacing extracted from source |
| Font analysis | ✅ Complete | Discrepancy identified between source and boilerplate |
| Asset inventory | ✅ Complete | 11 assets cataloged with sources and issues |
| SEO metadata capture | ✅ Complete | All meta tags, OG, Twitter captured |
| Analytics data layer capture | ✅ Complete | Full utag_data object documented |
| Accessibility audit | ✅ Complete | Gaps identified with remediation plan |
| Responsive breakpoint mapping | ✅ Complete | 5 key breakpoints analyzed |

## What Requires Manual Review

| Item | Owner | Estimated Effort |
|---|---|---|
| Hero featured story content (changes frequently) | Content Author | Ongoing |
| Brand font approval for self-hosting | Brand/Legal | 1-2 days |
| Alt text quality improvements | Content Author | 1 hour |
| Analytics data layer validation | Analytics Team | 2-3 days |
| Accessibility fixes implementation | Developer | 1-2 days |
| Cross-browser testing | QA | 2-3 days |
| Responsive testing on devices | QA | 2-3 days |

## What Requires Developer Correction

| Item | Priority | Estimated Effort |
|---|---|---|
| Update `styles/styles.css` design tokens to match UPS brand | Critical | 2-4 hours |
| Update `styles/fonts.css` — remove Roboto Condensed, fix font stacks | Critical | 1 hour |
| Implement hero block (featured-story variant) with responsive images | High | 4-6 hours |
| Implement story-cards variant for cards block | High | 3-4 hours |
| Create new `stats-band` block | High | 3-4 hours |
| Create new `media-card` block | Medium | 2-3 hours |
| Rewrite header block for UPS mega-menu | High | 8-12 hours |
| Rewrite footer block for UPS multi-column footer | High | 4-6 hours |
| Implement Tealium/analytics integration in delayed.js | High | 4-6 hours |
| Add OneTrust consent integration | High | 2-3 hours |
| Create `/nav` fragment content | High | 2-3 hours |
| Create `/footer` fragment content | High | 2-3 hours |
| Universal Editor model updates (component-models.json) | Medium | 2-3 hours |

## What Requires Stakeholder Approval

| Item | Stakeholder | Decision Needed |
|---|---|---|
| Font family — confirm Roboto (not Condensed) for headings | UX/Brand | Approve font migration |
| URL strategy — same URLs vs redirects | SEO + Engineering | Confirm URL pattern |
| Analytics parity scope — all 9 vendors or subset | Analytics + Product | Prioritize vendor integrations |
| Search functionality — include or defer | Product | Scope decision |
| Personalization — include or defer | Product + Marketing | Scope decision |
| Subscribe flow — implement or link externally | Product + Marketing | Scope decision |

## What Should NOT Be Migrated As-Is

| Item | Reason | Recommendation |
|---|---|---|
| `javascript:` URLs (Cookie Settings) | Bad practice, accessibility issue | Implement as button with JS handler |
| DoubleClick redirect URLs for careers | Opaque tracking URL | Use UTM parameters on direct link instead |
| LiveRamp tracking pixel | Third-party identifier syncing — evaluate privacy compliance | Review with legal before including |
| Multiple duplicate nav link references | Source has redundant markup | Simplify in EDS |
| Bootstrap grid classes | Source uses Bootstrap CSS framework | Replace with native CSS Grid/Flexbox in EDS |
| AEM-specific class names (aem-Grid*, cmp-*) | AEM authoring artifacts | Remove entirely |

## Recommended Next Steps Before Production Cutover

1. **Immediate (Week 1)**
   - Update design tokens in `styles/styles.css` to match UPS brand
   - Fix font configuration (remove Roboto Condensed heading usage)
   - Begin header/nav block development
   - Begin hero block development

2. **Short-term (Weeks 2-3)**
   - Complete all block implementations
   - Create nav and footer fragment content
   - Integrate Tealium analytics
   - Integrate OneTrust consent
   - Migrate DAM assets to EDS delivery path

3. **Validation (Week 4)**
   - Full accessibility audit with screen reader testing
   - Cross-browser and responsive device testing
   - Analytics data layer comparison (source vs EDS)
   - Visual regression comparison at all breakpoints
   - Performance testing (Core Web Vitals)

4. **Go-Live Preparation (Week 5)**
   - Stakeholder review and sign-off
   - Configure redirects if URL pattern changes
   - CDN configuration for EDS delivery
   - Monitoring and alerting setup
   - Rollback plan documented

5. **Post-Launch (Week 6+)**
   - Monitor analytics data continuity
   - Monitor Core Web Vitals
   - Address any visual regression reports
   - Content author training on Universal Editor
   - Iterate on authoring experience

---

## Summary Statement

This migration assessment documents a **comprehensive but incomplete** migration. The About UPS homepage is a medium-complexity page with significant dependencies on:

- **Custom UPS brand styling** (fonts, colors, buttons differ from EDS boilerplate)
- **Complex navigation** (mega-menu with 5 sections and 30+ sub-links)
- **Heavy analytics stack** (9 third-party vendors via Tealium)
- **Dynamic content** (featured stories rotate)
- **Responsive image delivery** (3 image variants per hero/background)

The page is **suitable for EDS migration** but requires:
- ~40-60 hours of developer effort for block implementation
- Stakeholder decisions on scope (search, personalization, subscribe)
- Analytics team validation before go-live
- Content author onboarding for Universal Editor

**The migration should NOT be considered complete until all items in the Manual Review Checklist (Output 11) are verified.**
