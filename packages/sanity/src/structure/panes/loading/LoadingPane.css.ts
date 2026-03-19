import {style} from '@vanilla-extract/css'

export const content = style({
  selectors: {
    '&&': {
      opacity: 0,
      transition: 'opacity 200ms',
    },
    '&&[data-mounted]': {
      opacity: 1,
    },
  },
})
