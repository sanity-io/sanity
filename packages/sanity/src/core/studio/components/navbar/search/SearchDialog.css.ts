import {css, firstThatWorks} from '#styled-system/css'

export const innerCard = css({
  flexDirection: 'column',
  overflow: firstThatWorks('clip', 'hidden'),
  pointerEvents: 'all',
  position: 'relative',
})

export const searchDialogBox = css({
  height: '100%',
  left: 0,
  overflow: firstThatWorks('clip', 'hidden'),
  pointerEvents: 'none',
  position: 'fixed',
  top: 0,
  width: '100%',
  zIndex: 1,
})
