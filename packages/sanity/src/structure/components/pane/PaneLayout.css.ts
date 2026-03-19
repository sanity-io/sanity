import {style} from '@vanilla-extract/css'

export const root = style({
  selectors: {
    '&&': {
      transition: 'opacity 200ms',
      position: 'relative',
      zIndex: 1,
      paddingLeft: 'env(safe-area-inset-left)',
      paddingRight: 'env(safe-area-inset-right)',
      opacity: 0,
    },
    '&&:not([hidden])': {
      display: 'flex',
    },
    '&&:not([data-collapsed])': {
      overflow: 'auto',
    },
    '&&[data-mounted]': {
      opacity: 1,
    },
    '&&[data-resizing]': {
      pointerEvents: 'none',
    },
  },
})
