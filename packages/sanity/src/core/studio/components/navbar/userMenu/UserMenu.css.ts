import {css} from '#styled-system/css'

export const menu = css({
  'maxWidth': '300px',
  // `&&` beats Box's own `min-width: 0` (Menu renders a Box)
  '&&': {
    minWidth: '200px',
  },
})

/** `${theme.avatar.sizes[2].size}px`, set by `UserMenu` */
export const avatarSize2Var = '--user-menu-avatar-size-2'

export const avatarBox = css({
  'position': 'relative',
  // `&&` beats the ui5 Box `min-width: 0` / `min-height: 0` utility classes
  '&&': {
    minWidth: `var(${avatarSize2Var})`,
    minHeight: `var(${avatarSize2Var})`,
  },
})
