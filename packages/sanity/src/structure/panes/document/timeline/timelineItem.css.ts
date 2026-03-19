import {createVar, style} from '@vanilla-extract/css'

export const iconColorVar = createVar()
export const iconBgVar = createVar()
export const avatarSizeVar = createVar()

export const iconBox = style({
  vars: {
    '--card-icon-color': iconColorVar,
  },
  backgroundColor: iconBgVar,
  boxShadow: '0 0 0 1px var(--card-bg-color)',
  position: 'absolute',
  width: avatarSizeVar,
  height: avatarSizeVar,
  right: '-3px',
  bottom: '-3px',
  borderRadius: '50%',
})

export const nameSkeletonLineHeightVar = createVar()

export const nameSkeleton = style({
  selectors: {
    '&&': {
      width: '6ch',
      height: nameSkeletonLineHeightVar,
    },
  },
})
