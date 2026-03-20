import {style, styleVariants} from '@vanilla-extract/css'

export const documentBox = style({
  selectors: {
    '&&': {
      position: 'relative',
    },
  },
})

const scrollerBase = style({})

export const scrollerVariants = styleVariants({
  enabled: {
    selectors: {
      [`&&`]: {
        height: '100%',
        overflow: 'auto',
        position: 'relative',
        scrollBehavior: 'smooth',
        outline: 'none',
      },
    },
  },
  disabled: {
    selectors: {
      [`&&`]: {
        height: '100%',
      },
    },
  },
})
