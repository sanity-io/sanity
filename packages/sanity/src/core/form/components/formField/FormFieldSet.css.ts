import {createVar, style} from '@vanilla-extract/css'

export const root = style({
  border: 'none',
  selectors: {
    /* See: https://thatemil.com/blog/2015/01/03/reset-your-fieldset/ */
    'body:not(:-moz-handler-blocked) &': {
      display: 'table-cell',
    },
  },
})

export const contentFocusRingVar = createVar()

export const content = style({
  outline: 'none',
  transition: 'border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
  selectors: {
    '&:focus': {
      boxShadow: contentFocusRingVar,
    },
    '&:focus:not(:focus-visible)': {
      boxShadow: 'none',
    },
  },
})

export const contentBorderLeft = style({
  borderLeft: '1px solid var(--card-border-color)',
  boxShadow: 'inset 0 0 0 transparent',
})

export const contentBorderLeftFocused = style({
  borderLeft: '1px solid var(--card-focus-ring-color)',
  boxShadow: 'inset 1px 0 0 var(--card-focus-ring-color)',
})
