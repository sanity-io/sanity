import {globalStyle, style} from '@vanilla-extract/css'

export const detailsFlex = style({})

globalStyle(`${detailsFlex} [data-ui='summary-icon']`, {
  transition: 'transform 0.2s',
  transform: 'rotate(-90deg)',
})

globalStyle(`${detailsFlex}[open] [data-ui='summary-icon']`, {
  transform: 'rotate(0)',
})

globalStyle(`${detailsFlex} > summary::-webkit-details-marker`, {
  display: 'none',
})

export const summaryBox = style({
  listStyle: 'none',
})
