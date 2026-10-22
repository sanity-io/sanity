import {css} from '#styled-system/css'

/** `&&` (0,2,0) outranks Text's own `& code` descendant rule (0,1,1), as the original did. */
export const segmentSpan = css({
  '&&': {
    background: 'none',
    color: 'inherit',
  },
})

export const errorMessageText = css({
  whiteSpace: 'pre-line',
})
