import {createVar, style} from '@vanilla-extract/css'

export const sizeVar = createVar()

export const avatarRoot = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '50%',
  minHeight: sizeVar,
  minWidth: sizeVar,
})

export const avatarRootBorder = style({
  boxShadow: 'inset 0 0 0 1px var(--card-border-color)',
})

export const avatarRootRemoveBg = style({
  vars: {
    '--card-avatar-gray-bg-color': 'transparent',
  },
})
