import {css} from '#styled-system/css'

export const detailsFlex = css({
  "& [data-ui='summary-icon']": {
    transition: 'transform 0.2s',
    transform: 'rotate(-90deg)',
  },
  "&[open] [data-ui='summary-icon']": {
    transform: 'rotate(0)',
  },
  '& > summary::-webkit-details-marker': {
    display: 'none',
  },
})

export const summaryBox = css({
  listStyle: 'none',
})
