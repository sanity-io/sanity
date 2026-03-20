import {createVar, style} from '@vanilla-extract/css'

export const maxWidthVar = createVar()

export const popoverCard = style({
  selectors: {
    '&&': {
      maxWidth: maxWidthVar,
    },
  },
})
