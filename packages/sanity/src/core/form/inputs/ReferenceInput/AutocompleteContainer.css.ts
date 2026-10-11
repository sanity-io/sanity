import {styleVariants} from '@vanilla-extract/css'

export const root = styleVariants({
  narrow: {
    gridTemplateColumns: 'minmax(0px, 1fr)',
  },
  wide: {
    gridTemplateColumns: '1fr min-content',
  },
})
