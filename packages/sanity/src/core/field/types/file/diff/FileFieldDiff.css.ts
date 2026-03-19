import {createVar, globalStyle, style} from '@vanilla-extract/css'

export const sizeDiffPositiveVar = createVar()
export const sizeDiffNegativeVar = createVar()

export const sizeDiff = style({
  selectors: {
    '&&:not([hidden])': {
      display: 'inline-block',
    },
  },
})

globalStyle(`.${sizeDiff} [data-number='positive']`, {
  color: sizeDiffPositiveVar,
})

globalStyle(`.${sizeDiff} [data-number='negative']`, {
  color: sizeDiffNegativeVar,
})
