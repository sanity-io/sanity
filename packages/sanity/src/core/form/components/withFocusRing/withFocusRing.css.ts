import {createVar, style} from '@vanilla-extract/css'

export const borderRadiusVar = createVar()
export const boxShadowVar = createVar()
export const focusBoxShadowVar = createVar()

export const focusRingClass = style({
  borderRadius: borderRadiusVar,
  outline: 'none',
  boxShadow: boxShadowVar,
  selectors: {
    '&:focus': {
      boxShadow: focusBoxShadowVar,
    },
  },
})
