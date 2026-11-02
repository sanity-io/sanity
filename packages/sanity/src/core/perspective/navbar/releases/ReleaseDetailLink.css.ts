import {css} from '#styled-system/css'

/**
 * Lays the link over the end of its release's menu item, which reserves that space. Its padding
 * mirrors the menu item's own, so the link covers the reserved space exactly.
 *
 * The container renders right after the menu item, so the sibling selectors show the link while
 * the item is hovered or is the menu's active item (`data-selected`, set on hover and by the
 * arrow keys). Devices without hover always show it: an invisible link would still take taps.
 */
export const releaseDetailLinkContainer = css({
  'position': 'absolute',
  'top': 0,
  'right': 0,
  'pointerEvents': 'none',
  'opacity': 0,
  '[data-ui="MenuItem"]:hover + &': {opacity: 1},
  '[data-ui="MenuItem"][data-selected] + &': {opacity: 1},
  '&:hover': {opacity: 1},
  '&:focus-within': {opacity: 1},
  '@media (hover: none)': {opacity: 1},
})

/** Only the link takes the pointer, so the container's padding still belongs to the menu item. */
export const releaseDetailLink = css({
  pointerEvents: 'auto',
})
