# Design Tokens

Single source of truth for breakpoints, type scale, and z-index in this app. Read this before touching layout, typography, or anything `fixed`/`sticky`/`absolute`. It exists because none of the three areas below had a defined standard before this doc — each grew ad hoc across different work sessions, and it shows (see the audit tables in each section).

**Status: documentation only.** Nothing currently enforces these rules automatically (no ESLint rule, no test). Treat it as the standard to write new code against and to match when you're already touching a file that violates it — not as a mandate to go retrofit the whole app in one pass. See "Enforcement" at the bottom.

---

## 1. Breakpoints

**Decision: use Tailwind's stock v4 breakpoints, unmodified.** Confirmed via `node_modules/tailwindcss/theme.css` and this repo's `src/index.css` (which only does `@import "tailwindcss"` + the daisyUI plugin — no `@theme` override). The app already uses these prefixes in 60+ places. There's no layout in this codebase today that needs a bespoke breakpoint — don't introduce a custom scale speculatively; revisit this decision only if a real layout shows up that the stock scale can't express.

| Prefix | Min-width | Typical device |
|---|---|---|
| *(none)* | 0 | phones, the default/mobile-first styles |
| `sm:` | 640px (40rem) | large phones / small tablets, landscape phones |
| `md:` | 768px (48rem) | tablets |
| `lg:` | 1024px (64rem) | small laptops |
| `xl:` | 1280px (80rem) | desktops |
| `2xl:` | 1536px (96rem) | large/wide desktops |

Mobile-first as usual: unprefixed classes are the base/smallest case, each prefix applies at that width **and up**.

---

## 2. Type scale

**The problem this section fixes:** `text-xs`, `text-[10px]`, and `text-[9px]` appear **113 times across 23 files**, almost none of it paired with a larger-viewport override. The same 9–12px text renders identically on a phone and a 27" monitor. Two concrete examples from the current codebase:

- `DeckBuilderPage.tsx` — the "CMD" badge label: `text-[9px] font-black opacity-70`
- `DeckDetailPage.tsx` / `WishlistPage.tsx` — recurring section eyebrows: `text-[10px] uppercase font-black tracking-widest opacity-50`

That eyebrow-label pattern (small, uppercase, bold, wide tracking, muted) is a real, intentional motif used consistently for section headers/stat titles across the app — it isn't wrong to want a small label style. The fix is to give it one sanctioned size with a floor and a responsive step-up, instead of every instance picking its own arbitrary pixel value.

### Roles

| Role | Use for | Base (mobile) | `md:` and up | Notes |
|---|---|---|---|---|
| **Body** | primary reading text: descriptions, form inputs, card body copy | `text-sm` (14px) | `md:text-base` (16px) | Form inputs are already forced to 16px in `index.css` to prevent iOS auto-zoom — don't undo that. |
| **Secondary / muted** | de-emphasized supporting text | `text-sm` (14px) | `text-sm` (14px) | De-emphasize with `opacity-*`/`text-base-content/*`, not by shrinking below Body size. |
| **Eyebrow / label** | uppercase section labels, stat titles, small badges — today's `text-[9px]`/`text-[10px]` spots | `text-xs` (12px) | `md:text-sm` (14px) | This is the role that must change. `text-xs` is the absolute floor, not a starting point to shrink further. |
| **Heading** | page/section titles (h1/h2/h3) | `text-lg`–`text-3xl` depending on level | step up one size at `md:` | Already reasonably handled today — keep the pattern, just be consistent with what step-up looks like. |

### Hard rule

**No arbitrary sub-12px font size anywhere.** `text-[10px]`, `text-[9px]`, `text-[8px]`, or any other `text-[Npx]` below 12px is not allowed, full stop — `text-xs` (12px) is the floor for any text a user is meant to read. If something genuinely needs to be that small, it shouldn't be text (use an icon, a color swatch, a dot).

### Before / after (using the real examples above)

```diff
- <span className="text-[9px] font-black opacity-70">CMD</span>
+ <span className="text-xs md:text-sm font-black opacity-70">CMD</span>

- <h2 className="text-[10px] uppercase font-black tracking-widest opacity-50">
+ <h2 className="text-xs md:text-sm uppercase font-black tracking-widest opacity-50">
```

---

## 3. Z-index scale

**The problem this section fixes:** z-index values in this app are ad hoc numbers picked per-component with no shared scale, and it's already produced real collisions — not just theoretical ones. Current usage as of this audit:

| Value | Used by | Note |
|---|---|---|
| `z-10` | `HandSimulator.tsx` (card highlight, error overlay) | Contained within a card's own local stacking context — low risk. |
| `z-[1]` | `WishlistCard.tsx` (×2), `ObjectiveManager.tsx` — all on daisyUI's `dropdown-content` class | **Likely bug** — see below. |
| `z-[20]` | `CardGallery.tsx` — also on `dropdown-content` | Same bug pattern as above, different number. |
| `z-30` | `WishlistPage.tsx`, `DeckDetailPage.tsx` sticky in-page headers | |
| `z-50` | `Header.tsx` (global header, **not** actually `sticky` — just `relative`), `DeckBuilderPage.tsx` navbar, `ImportDeckButton.tsx` modal backdrop, `SwapSidebar.tsx` floating action button | Four unrelated things sharing one value by coincidence, not design. |
| `z-60` | `SwapSidebar.tsx` backdrop | |
| `z-70` | `SwapSidebar.tsx` panel | |
| `z-100` | `CardSearchPanel.tsx` dropdown, `SwapSidebar.tsx` fullscreen image zoom, `HandSimulator.tsx` bottom toast | Three unrelated overlays sharing one value by coincidence. |
| `z-[9999]` | `CardImageTooltip.tsx` (portaled to `document.body` via `usePortal`) | Arbitrary "go nuclear" value. |

**The `z-[1]`/`z-[20]` cases are a real, likely-live bug, not just a style nit.** daisyUI's own `dropdown-content` class already carries `z-index: 999` from its component CSS (confirmed in `node_modules/daisyui/components/dropdown.css`). Adding a smaller custom `z-[1]`/`z-[20]` utility on top of it fights that default and can push the dropdown menu *underneath* nearby content instead of above it. Don't put a custom z-index utility on `dropdown-content` at all — let daisyUI handle it.

For reference, daisyUI's own reserved values (from the installed package, do not fight these with a custom override):

| daisyUI component | z-index |
|---|---|
| `.tooltip` (built-in) | 2 |
| `.drawer` | 10 |
| `.dropdown-content` | 999 |
| `.modal` | 999 |

### The app-level scale

Four tiers for anything *not* a daisyUI-managed component (dropdown/modal/drawer/tooltip use daisyUI's own values above — don't assign these tiers to them):

| Tier | Class | Value | Use for |
|---|---|---|---|
| Base | *(omit z-index entirely)* | auto | Normal in-flow content. Default — most things need nothing here. |
| Pinned bar | `z-30` | 30 | Sticky/fixed in-page bars: section headers, tab bars, anything that pins while scrolling but is conceptually still "part of the page." |
| App chrome | `z-40` | 40 | The persistent global `Header`. Above in-page pinned bars so it always wins if both are ever visible at once. |
| Overlay | `z-50` | 50 | Any custom (non-daisyUI) full-viewport overlay: backdrop *and* its panel/drawer/lightbox share this **one** tier — don't hand-pick separate numbers for backdrop vs. panel (e.g. `SwapSidebar`'s current 60/70 split). Render the backdrop element before the panel element in JSX and DOM order alone guarantees correct stacking between the two. |
| Always-on-top | `z-[1000]` | 1000 | Reserved for the rare case that must outrank even an open daisyUI modal/dropdown (999) — a global toast/notification layer, or a portaled element like `CardImageTooltip` that must never be occluded. Use sparingly and say why in a comment when you do. |

`CardImageTooltip.tsx`'s current `z-[9999]` should come down to `z-[1000]` under this scale — it's a portaled, must-never-be-occluded element, which is exactly the "Always-on-top" tier, just at a saner number with headroom documented instead of an arbitrary max-value guess.

---

## Enforcement

This doc is not wired into anything yet — it's the reference to write new code against and to reconcile toward when you're already in a file that violates it. It is **not** a mandate to sweep the whole app in one PR. Turning the known violations above into an actual cleanup, and/or backing the type-scale and z-index rules with an ESLint rule so drift can't silently reappear, is a good candidate for a follow-up `/tasks` entry — ask before starting one.
