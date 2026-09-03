import {createVar, style} from '@vanilla-extract/css'

/** `${avatar.sizes[size].size}px` */
export const avatarSizeVar = createVar()

export const avatarSkeleton = style({
  selectors: {
    // Skeleton is fully self-styled (Box + radius/animation rules), so override by specificity
    '&&': {
      borderRadius: '50%',
      width: avatarSizeVar,
      height: avatarSizeVar,
    },
  },
})
