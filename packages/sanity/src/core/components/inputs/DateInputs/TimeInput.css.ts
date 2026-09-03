import {style} from '@vanilla-extract/css'

export const timeInput = style({
  selectors: {
    // TextInput spreads `className` onto its <input>, which sets `line-height` itself
    '&&': {
      lineHeight: 1,
    },
  },
})
