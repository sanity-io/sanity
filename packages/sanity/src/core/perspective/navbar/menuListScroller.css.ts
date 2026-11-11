import {css} from '#styled-system/css'

/**
 * The scrolling list inside a perspective menu. The studio's global scrollbar is a 12px track with
 * a thin thumb centred in it, so on top of a row's own 4px padding the row stopped 16px short of
 * the menu's right edge, against 4px on the left.
 *
 * Here the track is 4px wide (its thumb 2px) and `scrollbar-gutter: stable` reserves it whether or
 * not the list scrolls, so the track is the right-hand gap: the row ends 4px from the edge, the
 * same as on the left, and the scrollbar never overlaps a row. Callers drop the right padding
 * (`menuListScrollerContent` for a list whose rows sit in padded cards, `menuListScrollerPadding`
 * for a list that pads itself). `&&` beats the padding and the global scrollbar rules.
 */
export const menuListScroller = css({
  '&&': {scrollbarGutter: 'stable'},
  '&&::-webkit-scrollbar': {width: '4px'},
  '&&::-webkit-scrollbar-thumb': {borderWidth: '1px'},
})

/** For a scroller that pads itself: the track replaces the right padding. */
export const menuListScrollerPadding = css({
  '&&&': {paddingRight: 0},
})

/** For a scroller whose rows sit in padded cards: the track replaces the cards' right padding. */
export const menuListScrollerContent = css({
  '&&& [data-ui="Card"]': {paddingRight: 0},
})
