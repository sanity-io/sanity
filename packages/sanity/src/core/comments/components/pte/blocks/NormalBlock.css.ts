import {style} from '@vanilla-extract/css'

export const normalText = style({
  selectors: {
    '&&': {
      wordBreak: 'break-word',
    },
  },
})
