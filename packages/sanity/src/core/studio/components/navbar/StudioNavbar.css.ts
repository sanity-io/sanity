import {style} from '@vanilla-extract/css'

export const rootLayer = style({
  selectors: {
    '&&': {
      minHeight: 'auto',
      position: 'relative',
    },
    '&&[data-search-open="true"]': {
      top: 0,
      position: 'sticky',
    },
  },
})

export const rootCard = style({
  selectors: {
    '&&': {
      lineHeight: 0,
    },
  },
})
