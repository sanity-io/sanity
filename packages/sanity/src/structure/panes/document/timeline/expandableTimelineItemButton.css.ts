import {style} from '@vanilla-extract/css'

export const flipIcon = style({
  transition: 'transform 200ms',
  selectors: {
    '&[data-expanded="true"]': {
      transform: 'rotate(-90deg)',
    },
  },
})
