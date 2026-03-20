import {style} from '@vanilla-extract/css'

export const rootCard = style({
  selectors: {
    '&&': {
      flex: 1,
      flexDirection: 'column',
    },
  },
})

export const headerStack = style({
  borderBottom: '1px solid var(--card-border-color)',
})

export const contentFlex = style({
  selectors: {
    '&&': {
      overflowY: 'scroll',
      overflowX: 'hidden',
    },
  },
})
