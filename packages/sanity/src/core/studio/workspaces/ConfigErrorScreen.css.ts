import {css} from '#styled-system/css'

export const centeredContainer = css({
  'boxSizing': 'border-box',
  /** ui5 Flex sets `min-height` on itself (`.sui-min-height`, (0,1,0)); `&&` outranks it. */
  '&&': {
    minHeight: '100vh',
  },
})

export const contentWrapper = css({
  width: '100%',
  maxWidth: '520px',
})

/** Rendered inside ui5's Text, which has no `a` rule, so this class sets the link's `color`. */
export const helpLink = css({
  'color': 'var(--card-link-fg-color)',
  'textDecoration': 'none',
  'display': 'inline-flex',
  'alignItems': 'center',
  'gap': '0.25em',
  '&:hover': {
    textDecoration: 'underline',
  },
})

// Inline monospace for config-key names mentioned in prose (see `InlineCode` in
// ConfigErrorScreen.tsx).
export const inlineCode = css({
  fontFamily: 'var(--card-code-family, monospace)',
  fontSize: '0.9em',
  background: 'var(--card-code-bg-color)',
  color: 'var(--card-code-fg-color)',
  padding: '0.1em 0.35em',
  borderRadius: '3px',
})
