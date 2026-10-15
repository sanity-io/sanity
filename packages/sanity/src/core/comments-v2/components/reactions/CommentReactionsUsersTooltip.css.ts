import {css} from '#styled-system/css'

export const contentStack = css({
  maxWidth: '180px',
})

export const textGroup = css({
  display: 'inline-block',
})

export const inlineText = css({
  /** `!important` is carried over from the original rule. */
  display: 'inline-block !important',
  whiteSpace: 'break-spaces',
})

export const textBox = css({
  lineHeight: 1,
  textAlign: 'center',
})
