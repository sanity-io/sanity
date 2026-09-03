import {style} from '@vanilla-extract/css'

export const styledHeading = style({
  selectors: {
    // `&&`: Heading's own `&:not([hidden]) {display: block}` is (0,2,0).
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
