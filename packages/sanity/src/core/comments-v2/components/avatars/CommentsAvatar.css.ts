import {globalStyle, style} from '@vanilla-extract/css'

export const commentsAvatar = style({})

globalStyle(`${commentsAvatar} svg > ellipse`, {
  stroke: 'transparent',
})
