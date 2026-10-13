import {globalStyle, style} from '@vanilla-extract/css'

export const dateWithTooltipElementQuery = style({})

// `.date-small` / `.date-medium` / `.date-large` are plain spans, so the descendant rules only
// compete with each other. The breakpoint blocks share a specificity and must stay in ascending
// order: an element past `media[2]` also carries `1` in `data-eq-min`, and the later rule wins.
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
