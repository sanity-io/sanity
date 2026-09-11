import {globalStyle, style} from '@vanilla-extract/css'

export const menu = style({
  minWidth: '240px',
  maxWidth: '320px',
})

/** (0,2,0) outranks the inner Stack's own `gap` rule (0,1,0), as the original selector did. */
globalStyle(`${menu} > [data-ui='Stack']`, {
  gap: 0,
})

export const sectionHeader = style({
  textTransform: 'uppercase',
  selectors: {
    /** Text sets `letter-spacing` on itself at (0,1,0); `&&` outranks it regardless of sheet order. */
    '&&': {
      letterSpacing: '0.04em',
    },
  },
})
