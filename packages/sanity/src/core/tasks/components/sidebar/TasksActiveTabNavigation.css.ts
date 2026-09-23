import {createVar, style} from '@vanilla-extract/css'

/** `color.input.default.enabled.border` */
export const inputBorderColorVar = createVar()

export const divider = style({
  height: '25px',
  width: '1px',
  backgroundColor: inputBorderColorVar,
})
