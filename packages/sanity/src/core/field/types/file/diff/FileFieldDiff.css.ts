import {createVar, globalStyle, style} from '@vanilla-extract/css'

/** `color.solid.positive.enabled.bg` (v2: `color.button.default.positive.enabled.bg`) */
export const sizeDiffPositiveVar = createVar()
/** `color.solid.critical.enabled.bg` (v2: `color.button.default.critical.enabled.bg`) */
export const sizeDiffNegativeVar = createVar()

export const sizeDiff = style({
  selectors: {
    // Rendered as the element of a `Card`, whose own `&:not([hidden]) {display: block}` is (0,2,0);
    // `&&` keeps this rule winning regardless of stylesheet order.
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
