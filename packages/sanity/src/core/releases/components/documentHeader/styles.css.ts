import {css} from '#styled-system/css'

export const chipButtonContainer = css({
  '--border-color': 'var(--card-border-color)',
  'display': 'inline-flex',
})

export const chipButton = css({
  'flex': 'none',
  'cursor': 'pointer',
  // Button sets `transition` (theme `style.button.root`) on its own class (0,1,0); the
  // runtime-injected wrapper used to win that tie by insertion order, so the class is doubled.
  '&&': {
    transition: 'none',
  },
  // Button assigns `--card-border-color` on its root class (0,1,0) and again in its disabled
  // (0,2,0) and hover/active/selected (0,3,0) variants. The original override only ever beat the
  // root rule, so it is scoped to the enabled state: (0,2,0) beats the root colours and never
  // applies while disabled, and the (0,3,0) interaction variants still win, exactly as before.
  "&:not([data-disabled='true'])": {
    '--card-border-color': 'var(--border-color)',
  },
})
