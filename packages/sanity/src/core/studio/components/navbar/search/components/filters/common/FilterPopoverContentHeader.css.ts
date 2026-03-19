import {createVar, style} from '@vanilla-extract/css'

export const borderColorVar = createVar()

export const searchHeaderBox = style({
  borderBottom: `1px solid ${borderColorVar}`,
  flexShrink: 0,
})

export const searchHeaderContentFlex = style({
  selectors: {
    '&&': {
      boxSizing: 'border-box',
    },
  },
})
