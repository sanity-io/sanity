import {style} from '@vanilla-extract/css'

export const statusIconWrapper = style({
  left: '8px',
  position: 'relative',
  width: '25px',
})

export const styledStack = style({
  selectors: {
    '&&': {
      maxWidth: '200px',
    },
  },
})
