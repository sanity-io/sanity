import {createVar, style} from '@vanilla-extract/css'

export const avatarSizeVar = createVar()

export const avatarSkeleton = style({
  selectors: {
    '&&': {
      borderRadius: '50%',
      width: avatarSizeVar,
      height: avatarSizeVar,
    },
  },
})
