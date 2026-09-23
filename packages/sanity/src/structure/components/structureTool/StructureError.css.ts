import {style} from '@vanilla-extract/css'

export const pathSegment = style({
  selectors: {
    '&:not(:last-child)::after': {
      content: "' ➝ '",
      opacity: 0.5,
    },
  },
})
