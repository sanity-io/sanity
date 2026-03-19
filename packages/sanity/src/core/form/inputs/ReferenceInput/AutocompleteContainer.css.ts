import {styleVariants} from '@vanilla-extract/css'

export const rootVariants = styleVariants({
  narrow: {
    selectors: {
      '&&': {
        gridTemplateColumns: 'minmax(0px, 1fr)',
      },
    },
  },
  wide: {
    selectors: {
      '&&': {
        gridTemplateColumns: '1fr min-content',
      },
    },
  },
})
