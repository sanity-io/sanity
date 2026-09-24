import {style} from '@vanilla-extract/css'

/** `&&` (0,2,0) outranks Text's own `& code` descendant rule (0,1,1), as the original did. */
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
