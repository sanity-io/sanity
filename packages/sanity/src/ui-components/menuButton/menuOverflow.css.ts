import {css} from '#styled-system/css'

/**
 * For the scroll container of a menu list, with `useMenuOverflow`.
 *
 * The list grows to 400px and then scrolls. Rows are 33.5px with 4px between them and the list
 * keeps 4px at each end, so 400px ends roughly half way through the 11th row: the cut row shows
 * there is more. A popover with `constrainSize` caps the menu to the room it has, and the list
 * shrinks with it, since it sits in a flex column with `min-height: 0`.
 *
 * `scroll-padding` keeps a row scrolled into view (by keyboard focus, or by `useMenuOverflow` when
 * the menu opens) 4px from the list's edge, so it never touches the search field above.
 *
 * While rows are hidden beyond an edge of the list (`data-scroll-up`, `data-scroll-down`, set by
 * `useMenuOverflow`), that edge fades: a 24px gradient from transparent to the menu's background,
 * stuck to the list's visible area. A negative margin cancels its height so it takes no room, and
 * it does not catch the pointer.
 */
export const menuOverflowScroller = css({
  'overflowX': 'hidden',
  'overflowY': 'auto',
  'maxHeight': '400px',
  'scrollPaddingBlock': '4px',
  '&::before, &::after': {
    content: '""',
    display: 'block',
    flexShrink: 0,
    height: '24px',
    opacity: 0,
    pointerEvents: 'none',
    position: 'sticky',
    zIndex: 1,
  },
  '&::before': {
    top: 0,
    marginBottom: '-24px',
    background: 'linear-gradient(to top, transparent, var(--card-bg-color))',
  },
  '&::after': {
    bottom: 0,
    marginTop: '-24px',
    background: 'linear-gradient(to bottom, transparent, var(--card-bg-color))',
  },
  '&[data-scroll-up]::before': {opacity: 1},
  '&[data-scroll-down]::after': {opacity: 1},
})
