import {style} from '@vanilla-extract/css'

export const styledMenu = style({
  selectors: {
    '&&': {
      maxWidth: '300px',
      minWidth: '200px',
    },
  },
})
