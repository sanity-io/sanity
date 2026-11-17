import {css} from '#styled-system/css'

export const searchResultsInnerFlex = css({
  opacity: 1,
  overflowX: 'hidden',
  overflowY: 'auto',
  position: 'relative',
  transition: '300ms opacity',
  width: '100%',
})

// Doubled class so it beats the `opacity` of `searchResultsInnerFlex` when both are set: Panda
// orders the rules of a property by value (`0.5` before `1`), so the order the classes are
// declared in does not decide the tie the way it did with vanilla-extract.
export const loadingFirstPage = css({
  '&&': {
    opacity: 0.5,
  },
})
