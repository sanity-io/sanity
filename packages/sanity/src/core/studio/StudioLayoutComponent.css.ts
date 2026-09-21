import {style} from '@vanilla-extract/css'

export const searchFullscreenPortalCard = style({
  height: '100%',
  left: 0,
  position: 'fixed',
  top: 0,
  width: '100%',
  zIndex: 200,
  selectors: {
    /** Card sets `overflow` from its `overflow="auto"` prop at (0,1,0); `&&` keeps this override winning. */
    '&&': {
      overflow: ['hidden', 'clip'],
    },
  },
})
