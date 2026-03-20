import {createVar, style} from '@vanilla-extract/css'

export const widthVar = createVar()

export const styledContainer = style({
  selectors: {
    '&&': {
      width: widthVar,
      maxWidth: '100%',
    },
  },
})
