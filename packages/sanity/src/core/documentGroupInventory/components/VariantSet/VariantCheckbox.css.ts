import {globalStyle, style} from '@vanilla-extract/css'

export const variantCheckbox = style({})

globalStyle(`${variantCheckbox} input::before`, {
  display: 'block',
  position: 'absolute',
  content: "''",
  inset: '-1rem',
})
