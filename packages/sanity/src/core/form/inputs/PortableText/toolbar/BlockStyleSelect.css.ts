import {globalStyle, style} from '@vanilla-extract/css'

export const menuItem = style({})

/* Change the border color variable used by BlockQuote
to make the border visible when the MenuItem is selected */
globalStyle(`${menuItem}[data-selected] [data-option='blockquote']`, {
  vars: {
    '--card-border-color': 'var(--card-muted-fg-color)',
  },
})
