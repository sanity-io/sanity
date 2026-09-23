import {globalStyle, style} from '@vanilla-extract/css'

export const statusText = style({
  selectors: {
    // `&&`: Text sets `color: var(--card-fg-color)` on itself.
    '&&': {
      color: 'var(--card-muted-fg-color)',
    },
  },
})

globalStyle(`${statusText} em`, {
  color: 'var(--card-fg-color)',
  fontWeight: 500,
  fontStyle: 'normal',
})
