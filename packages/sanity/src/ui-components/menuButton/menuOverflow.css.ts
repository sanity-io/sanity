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
 */
export const menuOverflowScroller = css({
  'overflowX': 'hidden',
  // A whole number of rows, measured by `useMenuOverflow`
  'maxHeight': 'var(--menu-list-max-height, none)',
  '&[data-overflowing] > *': {
    marginRight: 'calc(-1 * min(var(--menu-scrollbar-width, 0px), 8px))',
  },
})
