import {style} from '@vanilla-extract/css'

export const optionObserveElement = style({
  listStyle: 'none',
  whiteSpace: 'nowrap',
  flexShrink: 0,
  opacity: 0,
  visibility: 'hidden',
})

export const hiddenRow = style({
  selectors: {
    '&&': {
      opacity: 0,
      height: '0.1px',
      overflow: 'hidden',
    },
  },
})
