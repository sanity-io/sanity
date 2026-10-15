import {css} from '#styled-system/css'

// No base `opacity: 1`: Panda emits one atomic class per declaration, ordered by first
// occurrence across the project, so composing with a later `opacity: 1` utility would let
// that rule win over `loadingFirstPage`. The CSS initial value is already 1.
export const searchResultsInnerFlex = css({
  overflowX: 'hidden',
  overflowY: 'auto',
  position: 'relative',
  transition: '300ms opacity',
  width: '100%',
})

export const loadingFirstPage = css({
  opacity: 0.5,
})
