import {style, styleVariants} from '@vanilla-extract/css'

export const listItem = style({})

export const listItemState = styleVariants({
  moving: {
    selectors: {
      '&&': {
        zIndex: 10000,
        pointerEvents: 'none',
      },
    },
  },
  idle: {},
})
