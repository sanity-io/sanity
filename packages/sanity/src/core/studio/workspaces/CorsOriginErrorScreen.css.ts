import {style} from '@vanilla-extract/css'

export const centeredContainer = style({
  boxSizing: 'border-box',
  selectors: {
    '&&': {
      minHeight: '100vh',
    },
  },
})

export const contentWrapper = style({
  width: '100%',
  maxWidth: '640px',
})

export const helpLink = style({
  color: 'var(--card-link-fg-color)',
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.25em',
  selectors: {
    '&:hover': {
      textDecoration: 'underline',
    },
  },
})
