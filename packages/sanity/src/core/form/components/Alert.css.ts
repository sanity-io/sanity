import {style} from '@vanilla-extract/css'

export const suffixBox = style({
  selectors: {
    '&&': {
      borderTop: '1px solid var(--card-border-color)',
    },
  },
})
