import {css} from '#styled-system/css'

export const formFieldGutter = css({
  /**
   * The start gutter is only capable of displaying one indicator at a time. The
   * first element is always given precedence, with all subsequent elements being
   * hidden by this rule.
   */
  '& > * + *': {
    display: 'none',
  },
})
