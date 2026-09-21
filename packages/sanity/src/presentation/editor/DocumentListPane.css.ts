import {globalStyle, style} from '@vanilla-extract/css'

export const rootLayout = style({
  height: '100%',
})

export const root = style({})

// the original also declared `min-width: none !important`, an invalid value browsers drop
globalStyle(`${root} > div`, {
  maxWidth: 'none !important',
})

export const wrappedCode = style({
  whiteSpace: 'pre-wrap',
})
