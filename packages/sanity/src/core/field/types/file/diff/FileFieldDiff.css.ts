import {css} from '#styled-system/css'

/** `color.solid.positive.enabled.bg` (v2: `color.button.default.positive.enabled.bg`) */
export const sizeDiffPositiveVar = '--file-field-diff-size-diff-positive'
/** `color.solid.critical.enabled.bg` (v2: `color.button.default.critical.enabled.bg`) */
export const sizeDiffNegativeVar = '--file-field-diff-size-diff-negative'

export const sizeDiff = css({
  // Rendered as the element of a `Card`, whose own `&:not([hidden]) {display: block}` is (0,2,0);
  // `&&` keeps this rule winning regardless of stylesheet order.
  '&&:not([hidden])': {
    display: 'inline-block',
  },
  "& [data-number='positive']": {
    color: `var(${sizeDiffPositiveVar})`,
  },
  "& [data-number='negative']": {
    color: `var(${sizeDiffNegativeVar})`,
  },
})
