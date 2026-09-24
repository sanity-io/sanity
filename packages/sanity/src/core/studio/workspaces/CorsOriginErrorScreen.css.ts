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
  maxWidth: '640px',
})

/** Rendered inside ui5's Text, which has no `a` rule, so this class sets the link's `color`. */
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
