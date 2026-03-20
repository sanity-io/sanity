import {globalStyle, style} from '@vanilla-extract/css'

export const portableTextWrap = style({})

globalStyle(`${portableTextWrap} > [data-ui='Text']:not(:first-child)`, {
  marginTop: '1em', // todo: improve
})

globalStyle(`${portableTextWrap} > [data-ui='Text']:has(> span:empty)`, {
  display: 'none',
})
