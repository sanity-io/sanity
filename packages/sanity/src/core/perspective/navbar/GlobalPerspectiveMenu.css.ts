import {globalStyle, style} from '@vanilla-extract/css'

export const styledMenu = style({
  maxWidth: '320px',
  selectors: {
    // `&&` beats Box's own `min-width: 0` (Menu renders a Box)
    '&&': {
      minWidth: '200px',
    },
  },
})

/* Remove the default menu gap */
globalStyle(`${styledMenu} > [data-ui='Stack']`, {
  gap: 0,
})
