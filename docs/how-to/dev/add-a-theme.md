# Add a daisyUI theme

This guide adds a new theme to the theme picker in the global header.

## Goal

When you finish, the new theme shows in the header's theme dropdown with its color pips, applies across the app when picked, and is still there after a reload. Use this guide either to expose one of daisyUI's built-in themes that the picker doesn't list yet, or to add a custom theme like `arcane` and `grimoire`. It assumes you know Tailwind v4 and daisyUI v5 (the repo pins daisyUI 5.5.x).

## Prerequisites

- A working local checkout that runs `npm run dev`. See [Development setup](../../contributing/development-setup.md).
- The name of the theme. For a built-in, it must be one of daisyUI's theme names. For a custom theme, choose a lowercase name that no built-in theme already uses.

## Steps

### 1. Make the theme's CSS available

The theme's CSS goes in `src/index.css`.

**Built-in theme:** you don't need to change anything here. The daisyUI plugin is loaded with `themes: all`, so the CSS for every built-in theme is already in the build:

```css
@plugin "daisyui" {
  themes: all;
}
```

**Custom theme:** add a `@plugin "daisyui/theme"` block after the `grimoire` block. The simplest approach is to copy the `arcane` block (dark) or the `grimoire` block (light), then change `name`, `color-scheme`, and the colors:

```css
@plugin "daisyui/theme" {
  name: "mytheme";
  color-scheme: dark;          /* or light */
  --color-base-100: oklch(...);
  --color-base-200: oklch(...);
  --color-base-300: oklch(...);
  --color-base-content: oklch(...);
  --color-primary: oklch(...);
  --color-primary-content: oklch(...);
  /* ...secondary, accent, neutral, info, success, warning, error,
     each with a matching -content color... */
  --radius-selector: 1rem;
  --radius-field: 0.5rem;
  --radius-box: 0.75rem;
  --size-selector: 0.25rem;
  --size-field: 0.25rem;
  --border: 1px;
  --depth: 1;
  --noise: 1;
}
```

Define every `--color-*` token that the existing custom themes define. Components use only daisyUI's semantic tokens (`base-*`, `primary`, `error`, and so on), so a token you leave out shows up as a wrong color somewhere in the app.

### 2. Add the name to the `Theme` type

Add the name to the `Theme` union in `src/types/index.ts`:

```ts
export type Theme =
  | "arcane"
  | "grimoire"
  ...
  | "night"
  | "mytheme";
```

### 3. Add the name to the picker list

The header (`src/components/Header/Header.tsx`) only mounts `<ThemeDropdown theme={theme} onThemeChange={setTheme} />`. The list of themes is the `THEMES` array inside `src/components/ThemeDropDown/ThemeDropdown.tsx`. Add the name there:

```ts
const THEMES = [
  "arcane",
  "grimoire",
  ...
  "night",
  "mytheme",
];
```

The array's position sets the theme's position in the menu. The two signature themes come first. The label is the raw name with `capitalize` styling, so `mytheme` displays as "Mytheme".

`THEMES` is a plain string array, and each entry is cast to `Theme` on click. The type checker therefore won't flag a name that's missing from one list or misspelled in the other. Make sure the strings in steps 2 and 3 match exactly.

### 4. Check the pre-paint script and default theme

`index.html` has an inline script that reads `localStorage.theme` and sets `data-theme` on `<html>` before React mounts. `src/context/ThemeContext.tsx` has the same logic in `resolveInitialTheme()`. Neither one checks a stored name against a list, so a new theme needs **no change** in either file. It persists through the same `theme` localStorage key as every other theme.

Change these files only if you are making the new theme the **default** for new users. In that case, update all three places so they agree:

- `DEFAULT_THEME` in `src/context/ThemeContext.tsx`
- the `t = "arcane"` fallback in the `index.html` script
- the `data-theme="arcane"` attribute on `<html>` in `index.html`

### 5. Check contrast against the fixed mana colors

The WUBRG accents in `src/utils/manaColors.ts` (`MANA_HEX`) are fixed hex values. They don't change with the theme. They appear on theme surfaces in these places:

- the header's brand-mark pips, on `bg-base-100`
- the color-identity strip on each deck tile (`DeckCard`), on `bg-base-200`
- the identity line at the top of `CommanderBackdrop`

With the new theme active, check that each pip stays visible on those surfaces. White (`#f3e7b8`) is the one most likely to fade into a light base, and black (`#7a6a86`) the one most likely to fade into a dark base. If a pip disappears, adjust the theme's `base-*` colors. Don't change `MANA_HEX`.

Also check that each `*-content` color is readable on its matching color. Look at a page that uses `primary`, `error`, and `warning` (badges, alerts, buttons).

## Final Result

1. Run `npm run dev`, open the header's theme dropdown, and confirm the new entry is listed. Its four pips should show the theme's primary, secondary, accent, and neutral colors.
2. Select it. The whole app restyles, and the button's pips update.
3. Reload the page. The theme stays applied, the login and loading screens included, with no flash of `arcane` first.
4. Run `npm run build` to confirm the `Theme` union still type-checks.

## Next Steps

- [Design tokens](../../reference/design-tokens.md): type sizes, breakpoints, and the z-index scale that every theme has to work with.
- [Development setup](../../contributing/development-setup.md): local tooling and commands.
