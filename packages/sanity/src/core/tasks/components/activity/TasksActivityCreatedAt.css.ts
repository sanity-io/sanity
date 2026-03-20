import {style} from '@vanilla-extract/css'

export const userSkeleton = style({
  selectors: {
    '&&': {
      maxWidth: '15ch',
      width: '100%',
    },
  },
})
