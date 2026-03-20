import {style, globalStyle} from '@vanilla-extract/css'

export const styledText = style({})

globalStyle(`.${styledText} a`, {
  color: 'inherit',
})
