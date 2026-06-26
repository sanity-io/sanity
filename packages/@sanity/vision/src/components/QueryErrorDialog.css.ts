import {style} from '@vanilla-extract/css'

// `ErrorCode` always renders inside a critical-tone `Card`, so the card sets
// `--card-muted-fg-color` to the muted critical foreground color we want here.
// `&&` is needed to override the color @sanity/ui's Code sets on itself.
export const errorCode = style({
  selectors: {
    '&&': {
      color: 'var(--card-muted-fg-color)',
    },
  },
})
