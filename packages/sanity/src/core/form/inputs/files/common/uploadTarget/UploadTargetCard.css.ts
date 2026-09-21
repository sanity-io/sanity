import {style} from '@vanilla-extract/css'

export const styledCard = style({
  selectors: {
    // `&&`: Card (Box) sets `height` on itself through its `height` prop
    '&&': {
      height: '100%',
    },
  },
})
