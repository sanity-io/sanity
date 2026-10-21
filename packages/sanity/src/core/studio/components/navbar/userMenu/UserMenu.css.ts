import {createVar, style} from '@vanilla-extract/css'

export const menu = style({
  maxWidth: '300px',
  selectors: {
    '&&': {
      minWidth: '200px',
    },
  },
})

/** `${theme.avatar.sizes[2].size}px`, set by `UserMenu` */
export const avatarSize2Var = createVar()

export const avatarBox = style({
  position: 'relative',
  selectors: {
    '&&': {
      minWidth: avatarSize2Var,
      minHeight: avatarSize2Var,
    },
  },
})
