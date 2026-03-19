import {createVar, style} from '@vanilla-extract/css'

export const fieldGroupTabsMarginBottomVar = createVar()

export const fieldGroupTabsWrapper = style({
  selectors: {
    '&&': {
      marginBottom: fieldGroupTabsMarginBottomVar,
    },
  },
})

export const alignedBottomGrid = style({
  selectors: {
    '&&': {
      alignItems: 'flex-end',
    },
  },
})
