import {style} from '@vanilla-extract/css'

export const searchFullscreenPortalCard = style({
  selectors: {
    '&&': {
      height: '100%',
      left: 0,
      overflow: 'clip',
      position: 'fixed',
      top: 0,
      width: '100%',
      zIndex: 200,
    },
  },
})
