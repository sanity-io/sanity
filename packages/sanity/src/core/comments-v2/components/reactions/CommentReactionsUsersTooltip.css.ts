import {style} from '@vanilla-extract/css'

export const contentStack = style({
  maxWidth: '180px',
})

export const textGroup = style({
  display: 'inline-block',
})

export const inlineText = style({
  /** `!important` is carried over from the original rule. */
  display: 'inline-block !important',
  whiteSpace: 'break-spaces',
})

export const textBox = style({
  lineHeight: 1,
  textAlign: 'center',
})
