import {style} from '@vanilla-extract/css'

export const segmentSpan = style({
  selectors: {
    '&&': {
      background: 'none',
      color: 'inherit',
    },
  },
})

export const errorMessageText = style({
  whiteSpace: 'pre-line',
})
