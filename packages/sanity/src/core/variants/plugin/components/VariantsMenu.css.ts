import {css} from '#styled-system/css'

export const menu = css({
  // Menu renders a ui5 Box whose width utility class is loaded separately.
  '&&': {
    minWidth: '240px',
    maxWidth: '320px',
  },
  /** (0,2,0) outranks the inner Stack's own `gap` rule (0,1,0), as the original selector did. */
  "& > [data-ui='Stack']": {
    gap: 0,
  },
})

export const sectionHeader = css({
  'textTransform': 'uppercase',
  /** Text sets `letter-spacing` on itself at (0,1,0); `&&` outranks it regardless of sheet order. */
  '&&': {
    letterSpacing: '0.04em',
  },
})
