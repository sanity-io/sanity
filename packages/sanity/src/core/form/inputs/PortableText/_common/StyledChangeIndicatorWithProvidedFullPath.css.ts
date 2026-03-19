import {globalStyle, style} from '@vanilla-extract/css'

export const styledChangeIndicator = style({
  width: '1px',
  height: '100%',
})

globalStyle(`${styledChangeIndicator} > div`, {
  height: '100%',
})
