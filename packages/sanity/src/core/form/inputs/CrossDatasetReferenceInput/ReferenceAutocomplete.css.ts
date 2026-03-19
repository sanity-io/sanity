import {style} from '@vanilla-extract/css'

export const popover = style({
  overflow: 'auto',
  WebkitOverflowScrolling: 'touch',
})

export const noResultsText = style({
  selectors: {
    '&&': {
      wordBreak: 'break-word',
    },
  },
})
