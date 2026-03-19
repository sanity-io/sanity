import {style, globalStyle} from '@vanilla-extract/css'

export const centeredContainer = style({
  selectors: {
    '&&': {
      minHeight: '100vh',
      boxSizing: 'border-box',
    },
  },
})

export const contentWrapper = style({
  selectors: {
    '&&': {
      width: '100%',
      maxWidth: '640px',
    },
  },
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
