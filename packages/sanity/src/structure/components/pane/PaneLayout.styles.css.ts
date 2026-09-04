import {style} from '@vanilla-extract/css'

export const root = style({
  transition: 'opacity 200ms',
  position: 'relative',
  zIndex: 1,
  opacity: 0,
  selectors: {
    // Card (via Box) sets `padding` on itself
    '&&': {
      paddingLeft: 'env(safe-area-inset-left)',
      paddingRight: 'env(safe-area-inset-right)',
    },
    // Box sets `display` through its own `&:not([hidden])` rule, which this must beat
    '&&:not([hidden])': {
      display: 'flex',
    },
    '&:not([data-collapsed])': {
      overflow: 'auto',
    },
    '&[data-mounted]': {
      opacity: 1,
    },
    '&[data-resizing]': {
      pointerEvents: 'none',
    },
  },
})
