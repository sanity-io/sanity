import {createVar, style} from '@vanilla-extract/css'

export const borderColorVar = createVar()

export const clearButtonBox = style({
  selectors: {
    '&&': {
      borderTop: `1px solid ${borderColorVar}`,
      flexShrink: 0,
    },
  },
})
