import {createVar, style} from '@vanilla-extract/css'

/** `rem(theme.container[0])`, set by `WorkspaceAuth` */
export const container0Var = createVar()

export const chooserContainer = style({
  selectors: {
    '&&': {
      width: 'auto',
      minWidth: container0Var,
      minHeight: 0,
    },
  },
})
