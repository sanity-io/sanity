import {createVar, style} from '@vanilla-extract/css'

export const bgColorVar = createVar()
export const fgColorVar = createVar()

export const segment = style({
  backgroundColor: bgColorVar,
  color: fgColorVar,
  textDecoration: 'none',
})
