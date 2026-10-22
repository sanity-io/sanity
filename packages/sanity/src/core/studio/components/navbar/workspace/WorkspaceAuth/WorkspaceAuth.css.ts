import {css} from '#styled-system/css'

/** `rem(theme.container[0])`, set by `WorkspaceAuth` */
export const container0Var = '--workspace-auth-container-0'

export const chooserContainer = css({
  // `&&` beats Container's own `width: 100%` and Box's own `min-width: 0`
  '&&': {
    width: 'auto',
    minWidth: `var(${container0Var})`,
    minHeight: 0,
  },
})
