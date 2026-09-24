import {createVar, style} from '@vanilla-extract/css'

/** `rem(theme.container[0])`, set by `WorkspaceAuth` */
export const container0Var = createVar()

export const chooserContainer = style({
  selectors: {
    // `&&` beats Container's own `width: 100%` and Box's own `min-width: 0`
    '&&': {
      width: 'auto',
      minWidth: container0Var,
    },
  },
})
