import {style} from '@vanilla-extract/css'

export const columnarGrid = style({
  selectors: {
    // Grid/Inline set align-items on themselves
    '&&': {
      alignItems: 'flex-start',
    },
  },
})
