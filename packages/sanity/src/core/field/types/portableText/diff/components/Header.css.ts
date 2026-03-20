import {style} from '@vanilla-extract/css'

export const styledHeading = style({
  selectors: {
    '&&:not([hidden])': {
      display: 'inline',
      textTransform: 'none',
      margin: 0,
    },
    '&&:not([hidden])::before': {
      content: 'unset',
    },
    '&&:not([hidden])::after': {
      content: 'unset',
    },
  },
})
