import {style} from '@vanilla-extract/css'

export const columnarGrid = style({
  selectors: {
    '&&': {
      alignItems: 'flex-start',
    },
  },
})
