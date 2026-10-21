import {createVar, globalStyle, style} from '@vanilla-extract/css'

/** `color.solid.positive.enabled.bg` (v2: `color.button.default.positive.enabled.bg`) */
export const sizeDiffPositiveVar = createVar()
/** `color.solid.critical.enabled.bg` (v2: `color.button.default.critical.enabled.bg`) */
export const sizeDiffNegativeVar = createVar()

export const sizeDiff = style({
  selectors: {
    '&&:not([hidden])': {
      display: 'inline-block',
    },
  },
})

globalStyle(`${sizeDiff} [data-number='positive']`, {
  color: sizeDiffPositiveVar,
})

globalStyle(`${sizeDiff} [data-number='negative']`, {
  color: sizeDiffNegativeVar,
})
