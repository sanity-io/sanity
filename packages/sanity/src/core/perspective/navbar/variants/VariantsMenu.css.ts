import {css} from '#styled-system/css'

/**
 * Caps the menu to the popover height and scrolls the list section. `Menu`'s
 * own `overflow: auto` would scroll the whole popover.
 *
 * `display` and `overflow` use three classes so they beat `Box`'s
 * `&:not([hidden]) { display: block }` and the menu's `overflow: auto` class.
 * The inner `Stack` rule uses the same three classes plus `[data-ui="Stack"]`
 * so it beats `Stack`'s `&&:not([hidden]) { display: grid }` and its `grid-gap`.
 *
 * `--perspective-menu-viewport-inset` is the space kept on each side. Both widths subtract it
 * twice so the menu fits a phone, and they sit in the same three-class block because `Box`
 * resets `min-width: 0` with one class.
 */
export const variantsMenu = css({
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

/** Positions a variant's detail link over its menu item. */
export const variantMenuItemRow = css({
  position: 'relative',
})

/**
 * The critical tone for a variant whose conditions no longer match the config. The menu item paints
 * its icons with `var(--card-icon-color)` and ui5 `Icon` redeclares `--icon-color` on the svg, so
 * `&&` sets both on the svg itself. A selected row is filled with the accent colour, which the
 * critical tone does not stand out on, so there the icon takes the row's text colour.
 */
export const conditionMismatchIcon = css({
  '&&': {
    '--card-icon-color': 'var(--card-badge-critical-icon-color)',
    '--icon-color': 'var(--card-badge-critical-icon-color)',
  },
  '[data-selected] &&': {
    '--card-icon-color': 'var(--card-fg-color)',
    '--icon-color': 'var(--card-fg-color)',
  },
})
