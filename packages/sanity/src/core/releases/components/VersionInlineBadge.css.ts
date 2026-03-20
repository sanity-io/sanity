import {createVar, style} from '@vanilla-extract/css'

export const fgColorVar = createVar()
export const bgColorVar = createVar()

export const styledVersionInlineBadge = style({
  color: fgColorVar,
  backgroundColor: bgColorVar,
  borderRadius: '3px',
  textDecoration: 'none',
  padding: '0px 2px',
  fontWeight: 500,
})
