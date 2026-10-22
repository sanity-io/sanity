import {css} from '#styled-system/css'

/** `${avatar.sizes[size].size}px` */
export const avatarSizeVar = '--tasks-user-avatar-size'

export const avatarRoot = css({
  'minHeight': `var(${avatarSizeVar})`,
  'minWidth': `var(${avatarSizeVar})`,
  'display': 'flex',
  'alignItems': 'center',
  'justifyContent': 'center',
  'borderRadius': '50%',
  "[data-as='button'][data-selected] &": {
    "& [data-ui='Icon']": {
      '--icon-color-muted': 'light-dark(var(--blue-200), var(--blue-800))',
    },
  },
})

/** Added next to `avatarRoot` when `border` is set */
export const avatarRootBorder = css({
  boxShadow: 'inset 0 0 0 1px var(--card-border-color)',
})

/** Added next to `avatarRoot` when `removeBg` is set */
export const avatarRootRemoveBg = css({
  '--card-avatar-gray-bg-color': 'transparent',
})
