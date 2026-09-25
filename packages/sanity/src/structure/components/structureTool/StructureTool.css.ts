import {style} from '@vanilla-extract/css'

export const paneLayout = style({
  selectors: {
    // Card (via Box) sets `min-width` and `min-height` on itself
    '&&': {
      minHeight: '100%',
      minWidth: '320px',
    },
  },
})
