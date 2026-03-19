import {style} from '@vanilla-extract/css'

export const rootFieldset = style({
  selectors: {
    '&&': {
      border: 'none',
    },
  },
})

export const content = style({
  outline: 'none',
  transition: 'border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
  selectors: {
    '&:focus:not(:focus-visible)': {
      boxShadow: 'none',
    },
  },
})
