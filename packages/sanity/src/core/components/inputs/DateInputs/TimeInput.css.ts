import {css} from '#styled-system/css'

export const timeInput = css({
  // TextInput spreads `className` onto its <input>, which sets `line-height` itself
  '&&': {
    lineHeight: 1,
  },
})
