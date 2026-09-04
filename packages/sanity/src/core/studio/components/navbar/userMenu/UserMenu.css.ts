import {createVar, style} from '@vanilla-extract/css'

export const menu = style({
  maxWidth: '300px',
  selectors: {
    // `&&` beats Box's own `min-width: 0` (Menu renders a Box)
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
    // `&&` beats the ui5 Box `min-width: 0` / `min-height: 0` utility classes
    '&&': {
      minWidth: avatarSize2Var,
      minHeight: avatarSize2Var,
    },
  },
})
