import {style} from '@vanilla-extract/css'

export const scroller = style({
  selectors: {
    '&&': {
      height: '100%',
      overflow: 'auto',
      position: 'relative',
      scrollBehavior: 'smooth',
    },
  },
})
