import {style} from '@vanilla-extract/css'

export const searchResultsInnerFlex = style({
  opacity: 1,
  overflowX: 'hidden',
  overflowY: 'auto',
  position: 'relative',
  transition: '300ms opacity',
  width: '100%',
})

// Defined after the base so it wins the equal-specificity tie
export const loadingFirstPage = style({
  opacity: 0.5,
})
