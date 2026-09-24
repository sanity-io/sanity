import {style} from '@vanilla-extract/css'

/** `&&` (0,2,0) keeps the original's specificity; ui5's Text has no `code` rule to compete. */
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
