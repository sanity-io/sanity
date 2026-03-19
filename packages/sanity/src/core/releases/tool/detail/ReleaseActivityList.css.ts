import {style} from '@vanilla-extract/css'

export const virtualContainer = style({
  selectors: {
    '&&': {
      height: '100%',
      overflow: 'scroll',
    },
  },
})
