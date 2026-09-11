import {style} from '@vanilla-extract/css'

export const innerCard = style({
  flexDirection: 'column',
  overflow: ['hidden', 'clip'],
  pointerEvents: 'all',
  position: 'relative',
})

export const searchDialogBox = style({
  height: '100%',
  left: 0,
  overflow: ['hidden', 'clip'],
  pointerEvents: 'none',
  position: 'fixed',
  top: 0,
  width: '100%',
  zIndex: 1,
})
