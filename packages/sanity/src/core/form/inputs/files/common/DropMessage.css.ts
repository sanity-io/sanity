import {style} from '@vanilla-extract/css'

export const sticky = style({
  selectors: {
    '&&': {
      position: 'sticky',
      top: 0,
      bottom: 0,
      margin: 'auto',
    },
  },
})
