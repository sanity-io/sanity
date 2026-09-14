import {createVar, style} from '@vanilla-extract/css'

/** `color.input.default.enabled.placeholder` */
export const placeholderColorVar = createVar()

export const placeholderWrapper = style({
  color: placeholderColorVar,
})
