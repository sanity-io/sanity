import {style} from '@vanilla-extract/css'

export const thumbGrid = style({
  selectors: {
    // `&&`: Grid sets `grid-template-columns` on itself (`columns` prop)
    '&&': {
      gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
    },
  },
})
