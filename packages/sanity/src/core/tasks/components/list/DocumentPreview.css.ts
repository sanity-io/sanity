import {createVar, style} from '@vanilla-extract/css'

export const decorationColorVar = createVar()

export const styledIntentLink = style({
  textDecoration: 'underline',
  textDecorationColor: decorationColorVar,
  textUnderlineOffset: '2px',
})
