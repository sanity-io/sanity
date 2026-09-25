import {style} from '@vanilla-extract/css'

export const centeredContainer = style({
  boxSizing: 'border-box',
  selectors: {
    /** ui5 Flex sets `min-height` on itself (`.sui-min-height`, (0,1,0)); `&&` outranks it. */
    '&&': {
      minHeight: '100vh',
    },
  },
})

export const contentWrapper = style({
  width: '100%',
  maxWidth: '520px',
})

/**
 * Rendered inside Text, whose `& a` rule (0,1,1) already outranked this class's `color` in the
 * original; the plain class keeps that outcome.
 */
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

// Inline monospace for config-key names mentioned in prose (see `InlineCode` in
// ConfigErrorScreen.tsx). Text's own `& code` rule (0,1,1) outranks the `font-family` and
// `border-radius` here, as it did in the original.
export const inlineCode = style({
  fontFamily: 'var(--card-code-family, monospace)',
  fontSize: '0.9em',
  background: 'var(--card-code-bg-color)',
  color: 'var(--card-code-fg-color)',
  padding: '0.1em 0.35em',
  borderRadius: '3px',
})
