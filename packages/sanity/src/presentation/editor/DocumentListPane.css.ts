import {globalStyle, style} from '@vanilla-extract/css'

export const rootLayout = style({
  height: '100%',
})

export const root = style({})

globalStyle(`${root} > div`, {
  minWidth: 'none !important',
  maxWidth: 'none !important',
})

export const wrappedCode = style({
  whiteSpace: 'pre-wrap',
})
