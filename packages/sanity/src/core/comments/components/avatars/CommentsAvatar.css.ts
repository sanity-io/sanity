import {globalStyle, style} from '@vanilla-extract/css'

export const styledAvatar = style({})

globalStyle(`${styledAvatar} svg > ellipse`, {
  stroke: 'transparent',
})
