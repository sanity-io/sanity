import {css} from '#styled-system/css'

/**
 * Lays the link over the end of its row's menu item, which reserves that space with
 * `PerspectiveDetailLinkSpace`. The caller's padding mirrors the menu item's own, so the link
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

/** Only the link takes the pointer, so the container's padding still belongs to the menu item. */
export const detailLink = css({
  pointerEvents: 'auto',
})

/** Reserves the link's width only; the container places the link vertically. */
export const detailLinkSpace = css({
  height: 0,
  visibility: 'hidden',
})
