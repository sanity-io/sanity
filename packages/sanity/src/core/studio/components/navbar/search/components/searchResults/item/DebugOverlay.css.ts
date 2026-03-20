import {style} from '@vanilla-extract/css'

export const debugScoreCard = style({
  selectors: {
    '&&': {
      cursor: 'help',
      left: 0,
      position: 'absolute',
      top: 0,
    },
  },
})
