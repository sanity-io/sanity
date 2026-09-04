import {globalStyle, style} from '@vanilla-extract/css'

export const root = style({
  width: '1px',
  height: '100%',
})

globalStyle(`${root} > div`, {
  height: '100%',
})
