import {createVar, style} from '@vanilla-extract/css'

export const bgColorVar = createVar()

export const divider = style({
  height: '25px',
  width: '1px',
  backgroundColor: bgColorVar,
})
