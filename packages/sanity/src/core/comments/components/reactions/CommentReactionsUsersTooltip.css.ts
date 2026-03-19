import {globalStyle, style} from '@vanilla-extract/css'

export const contentStack = style({
  maxWidth: '180px',
})

export const textGroup = style({
  display: 'inline-block',
})

export const inlineText = style({
  selectors: {
    '&&': {
      display: 'inline-block !important' as any,
    },
  },
})

globalStyle(`${inlineText} > span`, {
  whiteSpace: 'break-spaces',
})

export const textBox = style({
  lineHeight: 1,
  textAlign: 'center',
})
