import {style} from '@vanilla-extract/css'

export const chipButtonContainer = style({
  display: 'inline-flex',
  vars: {
    '--border-color': 'var(--card-border-color)',
  },
})

export const chipButton = style({
  selectors: {
    '&&': {
      flex: 'none',
      transition: 'none',
      cursor: 'pointer',
    },
  },
  vars: {
    '--card-border-color': 'var(--border-color)',
  },
})
