import {style} from '@vanilla-extract/css'

export const root = style({
  bottom: 0,
  selectors: {
    // Layer sets `position: relative` on itself
    '&&': {
      position: 'sticky',
    },
  },
})

export const rootCard = style({
  selectors: {
    // Card (via Box) sets `padding` on itself
    '&&': {
      paddingBottom: 'env(safe-area-inset-bottom)',
    },
  },
})
