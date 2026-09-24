import {css} from '#styled-system/css'

/** `&&` (0,2,0) keeps the original's specificity; ui5's Text has no `code` rule to compete. */
export const segmentSpan = css({
  '&&': {
    background: 'none',
    color: 'inherit',
  },
})

export const errorMessageText = css({
  whiteSpace: 'pre-line',
})
