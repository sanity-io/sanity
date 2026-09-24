import {css} from '#styled-system/css'

export const root = css({
  'transition': 'opacity 200ms',
  'position': 'relative',
  'zIndex': 1,
  'opacity': 0,
  'overflow': 'auto',
  // Card (via Box) sets `padding` on itself
  '&&': {
    paddingLeft: 'env(safe-area-inset-left)',
    paddingRight: 'env(safe-area-inset-right)',
  },
  // Box sets `display` through its own `&:not([hidden])` rule, which this must beat
  '&&:not([hidden])': {
    display: 'flex',
  },
  '&[data-mounted]': {
    opacity: 1,
  },
  '&[data-resizing]': {
    pointerEvents: 'none',
  },
})
