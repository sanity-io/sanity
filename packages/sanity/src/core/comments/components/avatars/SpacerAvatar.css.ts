import {createVar, style} from '@vanilla-extract/css'

export const avatarSizeVar = createVar()

export const spacerAvatar = style({
  minWidth: avatarSizeVar,
})
