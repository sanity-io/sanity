import {css} from '#styled-system/css'

/**
 * For the scroll container of a menu list, with `useMenuOverflow`. The rows sit 8px from each
 * side (the menu's inset), inside the container's contents. While the list overflows, the
 * studio's standard scrollbar takes a 12px track (transparent, with a thin thumb) on the right,
 * which would read as 20px against the 8px on the left. So the contents grow into the track by
 * the width it takes, up to the 8px inset, where the container clips them: the rows then end at
 * the track and the thumb is the visible right edge.
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
    marginRight: 'calc(-1 * min(var(--menu-scrollbar-width, 0px), 8px))',
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
