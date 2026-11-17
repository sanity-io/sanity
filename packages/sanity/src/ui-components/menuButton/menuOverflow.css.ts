import {css} from '#styled-system/css'

/**
 * For the scroll container of a menu list, with `useMenuOverflow`. The rows sit 8px from each
 * side (the menu's inset), inside the container's contents. While the list overflows, the
 * studio's standard scrollbar takes a 12px track on the right: transparent, with a 4px thumb
 * 4px in from each side of it. Keeping the full inset before the track would read as 20px against
 * the 8px on the left; running the rows up to the track would leave a selected row 4px from the
 * thumb, so it looks cut off by it. The contents grow into the track's room by 4px less than the
 * inset: the rows end 4px before the track, which is 8px before the thumb, the list's visible
 * right edge. That is the same 8px the rows keep from the menu's left edge. How far that is
 * depends on the contents' own right padding (8px in the navbar menus, 4px where the menu adds the
 * rest), so `useMenuOverflow` measures it into `--menu-row-trim`.
 *
 * Only the row moves. Whatever sits at the end of a row (an icon, the view action) stays 8px from
 * the row's end while the list scrolls, the same as when it fits.
 *
 * `useMenuOverflow` measures the width the scrollbar actually takes into `--menu-scrollbar-width`.
 * An overlay scrollbar (Firefox, or no `::-webkit-scrollbar` styling) takes none, so the rows keep
 * their inset there instead of being clipped.
 *
 * The contents' own padding is the inset, so the container itself carries no horizontal padding.
 *
 * While rows are hidden beyond an edge of the list (`data-scroll-up`, `data-scroll-down`, set by
 * `useMenuOverflow` and updated as it scrolls), that edge fades: a 24px gradient from transparent
 * to the menu's background, over the rows. The fades stick to the list's visible area, inside any
 * group pinned to that end (`--menu-pinned-top`, `--menu-pinned-bottom`), so they never cover a
 * pinned row, and they take no room: a negative margin cancels their height. They do not catch the
 * pointer.
 */
export const menuOverflowScroller = css({
  'overflowX': 'hidden',
  // Whole rows plus half the next one when it scrolls, measured by `useMenuOverflow`
  'maxHeight': 'var(--menu-list-max-height, none)',
  '&[data-overflowing] > *': {
    marginRight: 'calc(-1 * var(--menu-row-trim, 0px))',
  },
  '&::before, &::after': {
    content: '""',
    display: 'block',
    flexShrink: 0,
    // The fade: 24px, cancelled by the negative margin below, so it takes no room
    height: '24px',
    opacity: 0,
    pointerEvents: 'none',
    position: 'sticky',
    zIndex: 1,
  },
  '&::before': {
    top: 'var(--menu-pinned-top, 0px)',
    marginBottom: '-24px',
    background: 'linear-gradient(to top, transparent, var(--card-bg-color))',
  },
  '&::after': {
    bottom: 'var(--menu-pinned-bottom, 0px)',
    marginTop: '-24px',
    background: 'linear-gradient(to bottom, transparent, var(--card-bg-color))',
  },
  '&[data-scroll-up]::before': {opacity: 1},
  '&[data-scroll-down]::after': {opacity: 1},
})
