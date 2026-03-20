import {globalStyle, style} from '@vanilla-extract/css'

export const statusText = style({})

globalStyle(`${statusText} strong`, {
  fontWeight: 500,
  color: 'var(--card-fg-color)',
})

globalStyle(`${statusText} time`, {
  whiteSpace: 'nowrap',
})
