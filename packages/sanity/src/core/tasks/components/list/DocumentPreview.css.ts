import {createVar, style} from '@vanilla-extract/css'

/** `color.input.default.enabled.border` */
export const inputBorderColorVar = createVar()

export const styledIntentLink = style({
  textDecoration: 'underline',
  textDecorationColor: inputBorderColorVar,
  textUnderlineOffset: '2px',
})
