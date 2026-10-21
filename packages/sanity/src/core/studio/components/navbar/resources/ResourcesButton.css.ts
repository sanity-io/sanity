import {style} from '@vanilla-extract/css'

export const menu = style({
  maxWidth: '300px',
  selectors: {
    '&&': {
      minWidth: '200px',
    },
  },
})
