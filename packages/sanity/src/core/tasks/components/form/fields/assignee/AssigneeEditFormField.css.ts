import {style} from '@vanilla-extract/css'

export const styledButton = style({
  selectors: {
    '&&': {
      padding: '3px 6px',
    },
  },
})
