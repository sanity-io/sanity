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
  maxWidth: '520px',
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

// Inline monospace for config-key names mentioned in prose (see `inlineCode` in
// ConfigErrorScreen.tsx).
export const inlineCode = style({
  fontFamily: 'var(--card-code-family, monospace)',
  fontSize: '0.9em',
  background: 'var(--card-code-bg-color)',
  color: 'var(--card-code-fg-color)',
  padding: '0.1em 0.35em',
  borderRadius: '3px',
})
