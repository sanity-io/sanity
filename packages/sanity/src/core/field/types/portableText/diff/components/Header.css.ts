import {style} from '@vanilla-extract/css'

export const styledHeading = style({
  selectors: {
    '&&:not([hidden])': {
      display: 'inline',
      textTransform: 'none',
      margin: '0',
    },
    '&&:not([hidden])::before, &&:not([hidden])::after': {
      content: 'unset',
    },
  },
})
