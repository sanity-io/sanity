import {style} from '@vanilla-extract/css'

export const rootLayer = style({
  selectors: {
    '&&': {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden',
    },
  },
})
