import {globalStyle, style} from '@vanilla-extract/css'

export const styledMenuItem = style({})

globalStyle(`${styledMenuItem}[data-selected] [data-option='blockquote']`, {
  vars: {
    '--card-border-color': 'var(--card-muted-fg-color)',
  },
})
