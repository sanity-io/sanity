import {style} from '@vanilla-extract/css'

export const containerFlex = style({
  selectors: {
    '&&': {
      maxWidth: '480px',
      minWidth: '150px',
      overflow: 'clip',
      width: '100%',
    },
  },
})
