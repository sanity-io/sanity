import {style} from '@vanilla-extract/css'

export const styledText = style({
  selectors: {
    '&&': {
      wordBreak: 'break-word',
    },
  },
})
