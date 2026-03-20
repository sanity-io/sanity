import {style, styleVariants} from '@vanilla-extract/css'

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

/** Nesting border + inset shadow when `level > 0` (see FormFieldSet). */
export const contentNesting = styleVariants({
  none: {},
  resting: {
    borderLeft: '1px solid var(--card-border-color)',
    boxShadow: 'inset 0 0 0 transparent',
  },
  focused: {
    borderLeft: '1px solid var(--card-focus-ring-color)',
    boxShadow: 'inset 1px 0 0 var(--card-focus-ring-color)',
  },
})
