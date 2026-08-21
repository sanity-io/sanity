import {globalStyle, style} from '@vanilla-extract/css'

export const formFieldGutter = style({})

/**
 * The start gutter is only capable of displaying one indicator at a time. The
 * first element is always given precedence, with all subsequent elements being
 * hidden by this rule.
 */
globalStyle(`${formFieldGutter} > * + *`, {
  display: 'none',
})
