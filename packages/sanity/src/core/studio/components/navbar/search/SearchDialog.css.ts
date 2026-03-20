import {style} from '@vanilla-extract/css'

export const innerCard = style({
  selectors: {
    '&&': {
      flexDirection: 'column',
      overflow: 'clip',
      pointerEvents: 'all',
      position: 'relative',
    },
  },
})

export const searchDialogBox = style({
  height: '100%',
  left: 0,
  overflow: 'clip',
  pointerEvents: 'none',
  position: 'fixed',
  top: 0,
  width: '100%',
  zIndex: 1,
})
