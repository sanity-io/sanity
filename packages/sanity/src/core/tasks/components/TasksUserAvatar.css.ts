import {createVar, style} from '@vanilla-extract/css'

/** `${avatar.sizes[size].size}px` */
export const avatarSizeVar = createVar()

export const avatarRoot = style({
  minHeight: avatarSizeVar,
  minWidth: avatarSizeVar,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '50%',
})

/** Added next to `avatarRoot` when `border` is set */
export const avatarRootBorder = style({
  boxShadow: 'inset 0 0 0 1px var(--card-border-color)',
})

/** Added next to `avatarRoot` when `removeBg` is set */
export const avatarRootRemoveBg = style({
  vars: {
    '--card-avatar-gray-bg-color': 'transparent',
  },
})
