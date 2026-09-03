import {style} from '@vanilla-extract/css'

export const fadeInFlex = style({
  opacity: 0,
  transition: 'opacity 200ms',
  selectors: {
    '&[data-ready]': {
      opacity: 1,
    },
  },
})
