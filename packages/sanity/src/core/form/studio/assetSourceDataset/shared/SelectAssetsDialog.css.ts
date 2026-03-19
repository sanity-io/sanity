import {style} from '@vanilla-extract/css'

export const cardLoadMore = style({
  selectors: {
    '&&': {
      borderTop: '1px solid var(--card-border-color)',
      position: 'sticky',
      bottom: 0,
      zIndex: 200,
    },
  },
})
