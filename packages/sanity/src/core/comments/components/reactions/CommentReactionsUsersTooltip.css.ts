import {css} from '#styled-system/css'

export const contentStack = css({
  maxWidth: '180px',
})

export const textGroup = css({
  display: 'inline-block',
})

export const inlineText = css({
  // `&&` beats ui5 Text's own display (`.sui-Text`, same specificity as a single class)
  '&&': {
    display: 'inline-block',
    whiteSpace: 'break-spaces',
  },
})

export const textBox = css({
  lineHeight: 1,
  textAlign: 'center',
})
