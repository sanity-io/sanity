import {createVar, style} from '@vanilla-extract/css'

export const iconColorFgVar = createVar()
export const iconColorBgVar = createVar()
export const iconSizeVar = createVar()

export const iconBox = style({
  selectors: {
    '&&': {
      // @ts-expect-error custom property
      '--card-icon-color': iconColorFgVar,
      backgroundColor: iconColorBgVar,
      boxShadow: '0 0 0 1px var(--card-bg-color)',
      position: 'absolute',
      width: iconSizeVar,
      height: iconSizeVar,
      right: '-3px',
      bottom: '-3px',
      borderRadius: '50%',
    },
  },
})

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

export const nameWidthVar = createVar()
export const nameHeightVar = createVar()

export const nameSkeleton = style({
  selectors: {
    '&&': {
      width: '6ch',
      height: nameHeightVar,
    },
  },
})
