import {globalStyle, style} from '@vanilla-extract/css'

export const headerButton = style({
  display: 'block',
  WebkitFontSmoothing: 'inherit',
  appearance: 'none',
  font: 'inherit',
  background: 'none',
  width: '100%',
  textAlign: 'left',
  border: '0',
  margin: '0',
  padding: '0',
  outline: 'none',
})

export const header = style({
  selectors: {
    '&&': {
      cursor: 'default',
      lineHeight: '0',
    },
  },
})

export const iconBox = style({})

globalStyle(`${iconBox} > div > svg`, {
  transform: 'rotate(0)',
  transition: 'transform 100ms',
})

globalStyle(`${iconBox}[data-open] > div > svg`, {
  transform: 'rotate(90deg)',
})
