import {style} from '@vanilla-extract/css'

export const hoverCard = style({
  transition: 'opacity 100ms ease',
  selectors: {
    '&:hover': {
      opacity: 0.1,
    },
    '&:active': {
      pointerEvents: 'none',
    },
  },
})
