import {style} from '@vanilla-extract/css'

export const root = style({
  selectors: {
    '&&': {
      position: 'sticky',
      bottom: 0,
    },
  },
})

export const rootCard = style({
  selectors: {
    '&&': {
      paddingBottom: 'env(safe-area-inset-bottom)',
    },
  },
})
