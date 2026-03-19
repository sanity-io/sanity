import {style} from '@vanilla-extract/css'

export const placeholder = style({
  selectors: {
    '&&': {
      minHeight: '6em',
    },
  },
})
