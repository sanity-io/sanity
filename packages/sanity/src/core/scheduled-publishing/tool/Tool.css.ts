import {style} from '@vanilla-extract/css'

export const column = style({
  selectors: {
    '&&': {
      flexDirection: 'column',
    },
    '&&:not(:last-child)': {
      borderRight: '1px solid var(--card-border-color)',
    },
  },
})
