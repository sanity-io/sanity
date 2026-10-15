import {css} from '#styled-system/css'

export const searchResultsInnerFlex = css({
  opacity: 1,
  overflowX: 'hidden',
  overflowY: 'auto',
  position: 'relative',
  transition: '300ms opacity',
  width: '100%',
})

// Defined after the base so it wins the equal-specificity tie
export const loadingFirstPage = css({
  opacity: 0.5,
})
