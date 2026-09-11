import {style} from '@vanilla-extract/css'

export const content = style({
  opacity: 0,
  transition: 'opacity 200ms',
  selectors: {
    '&[data-mounted]': {
      opacity: 1,
    },
  },
})
