import {css} from '#styled-system/css'

export const avatarSizeVar = '--spacer-avatar-size'

export const spacerAvatar = css({
  minWidth: `var(${avatarSizeVar})`,
})
