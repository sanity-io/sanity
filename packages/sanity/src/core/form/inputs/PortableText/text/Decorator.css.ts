import {style} from '@vanilla-extract/css'

export const root = style({
  selectors: {
    "&[data-mark='code']": {
      color: 'inherit',
    },
  },
})
