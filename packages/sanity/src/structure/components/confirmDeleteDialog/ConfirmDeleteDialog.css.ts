import {style} from '@vanilla-extract/css'

export const dialogBody = style({
  selectors: {
    '&&': {
      boxSizing: 'border-box',
    },
  },
})

export const loadingContainer = style({
  selectors: {
    '&&': {
      height: '110px',
    },
  },
})
