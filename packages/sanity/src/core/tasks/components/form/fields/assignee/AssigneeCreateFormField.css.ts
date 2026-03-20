import {createVar, style} from '@vanilla-extract/css'

export const placeholderColorVar = createVar()

export const focusableCard = style({
  selectors: {
    '&&[data-as="button"]': {
      border: '1px solid var(--card-border-color)',
    },
    '&&[data-as="button"]:focus-within': {
      border: '1px solid var(--card-focus-ring-color)',
    },
  },
  vars: {
    '--card-muted-fg-color': placeholderColorVar,
  },
})
