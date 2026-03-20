import {globalStyle, style} from '@vanilla-extract/css'

export const styledMenu = style({
  selectors: {
    '&&': {
      minWidth: '200px',
      maxWidth: '320px',
    },
  },
})

/* Remove the default menu gap */
globalStyle(`${styledMenu} > [data-ui='Stack']`, {
  gap: '0',
})
