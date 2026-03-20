import {style} from '@vanilla-extract/css'

export const wrappedCode = style({
  selectors: {
    '&&': {
      whiteSpace: 'pre-wrap',
    },
  },
})
