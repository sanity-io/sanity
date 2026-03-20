import {style} from '@vanilla-extract/css'

export const fadeInFlex = style({
  selectors: {
    '&&': {
      opacity: 0,
      transition: 'opacity 200ms',
    },
    '&&[data-ready]': {
      opacity: 1,
    },
  },
})
