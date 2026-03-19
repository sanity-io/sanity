import {style} from '@vanilla-extract/css'

export const listItem = style({})

export const errorMessageRoot = style({
  selectors: {
    '&&': {
      padding: 'var(--space-4, 1rem)',
    },
  },
})
