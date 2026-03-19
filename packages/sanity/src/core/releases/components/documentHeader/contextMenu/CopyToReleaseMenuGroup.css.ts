import {style} from '@vanilla-extract/css'

export const releasesList = style({
  selectors: {
    '&&': {
      maxWidth: '300px',
      maxHeight: '200px',
      overflowY: 'auto',
    },
  },
})
