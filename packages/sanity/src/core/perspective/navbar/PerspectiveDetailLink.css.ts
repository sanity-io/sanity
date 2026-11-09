import {css} from '#styled-system/css'

/**
 * Lays the link over the end of its row's menu item, which reserves that space with
 * `renderWithDetailLinkSpace`. The caller's padding mirrors the menu item's own, so the link
 * covers the reserved space.
 *
 * The row renders `data-detail-link-row`. The link shows while the row is hovered, and while
 * focus is in it: the menu focuses the item it makes active, on hover and with the arrow keys.
 * Devices without hover always show it: an invisible link would still take taps.
 */
export const detailLinkContainer = css({
  'position': 'absolute',
  'top': 0,
  'right': 0,
  'bottom': 0,
  'pointerEvents': 'none',
  'opacity': 0,
  '[data-detail-link-row]:hover &': {opacity: 1},
  '[data-detail-link-row]:focus-within &': {opacity: 1},
  '@media (hover: none)': {opacity: 1},
})

/**
 * Only the link takes the pointer, so the container's padding still belongs to the menu item.
 *
 * A ui5 tertiary button paints `--backdrop` at rest, which only a ui5 surface defines. These menus
 * are `@sanity/ui` v4, so the variable resolves to an unrelated colour further up the page. A
 * transparent rest background lets the button sit on the row in every state (hovered, selected),
 * and its hover still blends ui5's grey into that. Doubled to beat `.sui-Button` on specificity.
 *
 * On a selected row the arrow takes the row's text colour, `--detail-link-selected-fg`, at rest and
 * on hover: ui5's hover would otherwise mix its own foreground back in.
 */
export const detailLink = css({
  '&&': {
    '--background-color': 'transparent',
    'pointerEvents': 'auto',
  },
  '&&[data-selected]': {'--foreground-color': 'var(--detail-link-selected-fg)'},
  '&&[data-selected]:hover': {color: 'var(--detail-link-selected-fg)'},
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
