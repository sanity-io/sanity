import {style} from '@vanilla-extract/css'

export const menuActionsWrapper = style({
  selectors: {
    '&&': {
      position: 'absolute',
      top: 0,
      right: 0,
    },
  },
})
