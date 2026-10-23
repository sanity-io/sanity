import {css} from '#styled-system/css'

/** `${space[1]}px` */
export const space1Var = '--document-preview-presence-space-1'

export const avatarStackBox = css({
  margin: `calc(-1 * var(${space1Var}))`,
})
