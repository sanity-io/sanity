import {style} from '@vanilla-extract/css'

export const wrapper = style({
  selectors: {
    '&&': {
      position: 'absolute',
      top: 0,
      left: 0,
    },
  },
})
