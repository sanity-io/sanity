import {style} from '@vanilla-extract/css'

export const diffViewPaneLayout = style({
  selectors: {
    '&&': {
      position: 'relative',
      gridArea: 'var(--grid-area)',
    },
  },
})

export const container = style({
  selectors: {
    '&&': {
      width: 'auto',
    },
  },
})
