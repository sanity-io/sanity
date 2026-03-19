import {globalStyle, style} from '@vanilla-extract/css'

export const dateWithTooltipElementQuery = style({})

globalStyle(`${dateWithTooltipElementQuery} .date-small`, {
  display: 'inline',
})

globalStyle(`${dateWithTooltipElementQuery} .date-medium`, {
  display: 'none',
})

globalStyle(`${dateWithTooltipElementQuery} .date-large`, {
  display: 'none',
})

globalStyle(`${dateWithTooltipElementQuery}[data-eq-min~='1'] .date-small`, {
  display: 'none',
})

globalStyle(`${dateWithTooltipElementQuery}[data-eq-min~='1'] .date-medium`, {
  display: 'inline',
})

globalStyle(`${dateWithTooltipElementQuery}[data-eq-min~='1'] .date-large`, {
  display: 'none',
})

globalStyle(`${dateWithTooltipElementQuery}[data-eq-min~='2'] .date-small`, {
  display: 'none',
})

globalStyle(`${dateWithTooltipElementQuery}[data-eq-min~='2'] .date-medium`, {
  display: 'none',
})

globalStyle(`${dateWithTooltipElementQuery}[data-eq-min~='2'] .date-large`, {
  display: 'inline',
})
