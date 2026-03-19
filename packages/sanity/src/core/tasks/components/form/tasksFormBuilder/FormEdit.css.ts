import {createVar, style} from '@vanilla-extract/css'

export const columnGapVar = createVar()
export const rowGapVar = createVar()

export const firstRow = style({
  selectors: {
    '&&': {
      columnGap: columnGapVar,
      rowGap: rowGapVar,
    },
  },
})
