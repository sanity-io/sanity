import {css} from '#styled-system/css'

/**
 * Lays the link over the end of its row's menu item, which reserves that space with
 * `renderWithDetailLinkSpace`. The caller's padding mirrors the menu item's own, so the link
 * covers the reserved space.
 *
 * The link shows on the active row only (`data-active`, from `usePerspectiveDetailLink`): the one
 * under the pointer or with keyboard focus. It does not read `:hover` or `:focus-within`, which
 * disagree with the menu's active row: focus can stay on a row the pointer has left, and keep its
 * link showing next to the new active row's.
 * Devices without hover always show it: an invisible link would still take taps.
 */
export const detailLinkContainer = css({
  'position': 'absolute',
  'top': 0,
  'right': 0,
  'bottom': 0,
  'pointerEvents': 'none',
  'opacity': 0,
  '&[data-active]': {opacity: 1},
  '@media (hover: none)': {opacity: 1},
})

/**
 * Only the link takes the pointer, so the container's padding still belongs to the menu item.
 *
 * A ui5 tertiary button paints `--backdrop` at rest, which only a ui5 surface defines. These menus
 * are `@sanity/ui` v4, so the variable resolves to an unrelated colour further up the page.
 * Instead the button draws its own box from its text colour: a 1px border and a faint fill, so it
 * reads as a separate button on the row rather than part of the row's own click target. Both mix
 * `currentColor`, so the box follows the arrow onto every row state (hovered, selected) in light
 * and dark mode, and ui5's hover still blends its grey into the fill. Doubled to beat
 * `.sui-Button` on specificity.
 *
 * While the menu marks the row's item selected, the arrow takes the item's text colour,
 * `--detail-link-selected-fg`, at rest and on hover: ui5's hover would otherwise mix its own
 * foreground back in. A `@sanity/ui` menu marks its active item selected (the one under the
 * pointer or keyboard focus), not only the selected perspective, so this follows the attribute.
 */
export const detailLink = css({
  '&&': {
    '--background-color': 'color-mix(in srgb, currentColor 8%, transparent)',
    '--border-color': 'color-mix(in srgb, currentColor 30%, transparent)',
    'pointerEvents': 'auto',
  },
  '[data-detail-link-row]:has([data-ui="MenuItem"][data-selected]) &&': {
    '--foreground-color': 'var(--detail-link-selected-fg)',
    '&:hover': {color: 'var(--detail-link-selected-fg)'},
    // The default focus ring is the accent colour, the colour of the selected row's fill, so it
    // vanishes there. The row's text colour stays at 3:1 or more against that fill.
    '&:focus-visible': {outlineColor: 'var(--detail-link-selected-fg)'},
  },
})

/**
 * Reserves the link's width only; the container places the link vertically. 25px is a ui5
 * `IconButton` at regular density (a 17px icon box and 4px padding on each side);
 * `PerspectiveDetailLink.browser.test.tsx` checks the two stay equal.
 */
export const detailLinkSpace = css({
  width: '25px',
  height: 0,
})
