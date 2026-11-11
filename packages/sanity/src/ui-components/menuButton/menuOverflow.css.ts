import {css} from '#styled-system/css'

/**
 * For the scroll container of a menu list, with `useMenuOverflow`. The rows sit 4px from each
 * side, inside the container's contents. While the list overflows, the studio's standard
 * scrollbar takes a 12px track (transparent, with a thin thumb) on the right, which would read
 * as 16px against the 4px on the left. So the contents grow 4px into the track, where the
 * container clips them: the rows then end at the track and the thumb is the visible right edge.
 *
 * The contents' own padding is the 4px, so the container itself carries no horizontal padding.
 *
 * The 12px track only exists where `::-webkit-scrollbar` styling applies. Elsewhere (Firefox, or an
 * overlay scrollbar) no track takes space, so the shift would clip the rows' padding: it applies
 * only under `@supports selector(::-webkit-scrollbar)`.
 */
export const menuOverflowScroller = css({
  'overflowX': 'hidden',
  '@supports selector(::-webkit-scrollbar)': {
    '&[data-overflowing] > *': {marginRight: '-4px'},
  },
})
