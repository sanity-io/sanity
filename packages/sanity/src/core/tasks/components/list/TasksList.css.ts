import {globalStyle, style} from '@vanilla-extract/css'

export const detailsFlex = style({
  selectors: {
    '&&': {
      display: 'flex',
      flexDirection: 'column',
    },
  },
})

export const summaryIcon = style({
  transition: 'transform 0.2s',
  transform: 'rotate(-90deg)',
})

globalStyle(`${detailsFlex}[open] ${summaryIcon}`, {
  transform: 'rotate(0)',
})

globalStyle(`${detailsFlex} > summary::-webkit-details-marker`, {
  display: 'none',
})

export const summaryBox = style({
  selectors: {
    '&&': {
      listStyle: 'none',
    },
  },
})
