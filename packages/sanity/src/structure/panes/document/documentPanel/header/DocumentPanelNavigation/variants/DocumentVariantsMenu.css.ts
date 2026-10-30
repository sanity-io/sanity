import {css} from '#styled-system/css'

/**
 * Caps the menu to the popover height and scrolls the list section. `Menu`'s own
 * `overflow: auto` would scroll the whole popover.
 *
 * `display` and `overflow` use three classes so they beat `Box`'s
 * `&:not([hidden]) { display: block }` and the menu's `overflow: auto` class. The inner `Stack`
 * rule uses the same three classes plus `[data-ui="Stack"]` so it beats `Stack`'s
 * `&&:not([hidden]) { display: grid }` and its `grid-gap`.
 *
 * `--perspective-menu-viewport-inset` is the space kept on each side, as in the navbar perspective
 * menus. Both widths subtract it twice so the menu fits a phone, and they sit in the same
 * three-class block because `Box` resets `min-width: 0` with one class.
 */
export const documentVariantsMenu = css({
  '&&&': {
    '--perspective-menu-viewport-inset': '12px',
    'minWidth': 'min(280px, calc(100vw - (var(--perspective-menu-viewport-inset) * 2)))',
    'maxWidth': 'min(360px, calc(100vw - (var(--perspective-menu-viewport-inset) * 2)))',
    'display': 'flex',
    'flexDirection': 'column',
    'flex': 1,
    'minHeight': 0,
    'maxHeight': '100%',
    'overflow': 'hidden',
  },
  '&&& > [data-ui="Stack"]': {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
    gap: 0,
    overflow: 'hidden',
  },
})

/**
 * Suggest-tone rhombus of the menu items. The menu item paints `[data-sanity-icon]` with
 * `var(--card-icon-color)`, so `&&` sets it on the svg itself.
 */
export const variantIcon = css({
  '&&': {
    '--card-icon-color': 'var(--card-badge-suggest-icon-color)',
    '--icon-color': 'var(--card-badge-suggest-icon-color)',
  },
})

/** Hairline between the variants menu and the badges after it. */
export const menuDivider = css({
  width: '1px',
  alignSelf: 'stretch',
  marginInline: '8px',
  marginBlock: '6px',
  flexShrink: 0,
  backgroundColor: 'var(--card-border-color)',
})

/** The version count and its glyph at the end of a menu item. */
export const versionCount = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  color: 'var(--card-muted-fg-color)',
})
