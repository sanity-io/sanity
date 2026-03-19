import {style} from '@vanilla-extract/css'

export const centerAligned = style({
  selectors: {
    '&&': {
      alignSelf: 'center',
    },
  },
})
