import {css} from '#styled-system/css'

/** `${avatar.sizes[size].size}px` */
export const avatarSizeVar = '--user-avatar-size'

export const avatarSkeleton = css({
  // Skeleton is fully self-styled (Box + radius/animation rules), so override by specificity
  '&&': {
    borderRadius: '50%',
    width: `var(${avatarSizeVar})`,
    height: `var(${avatarSizeVar})`,
  },
})
