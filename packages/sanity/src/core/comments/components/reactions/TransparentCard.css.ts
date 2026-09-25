import {style} from '@vanilla-extract/css'

export const transparentCard = style({
  selectors: {
    // `&&` beats Card's own `background-color: var(--card-bg-color)`
    '&&': {
      background: 'none',
    },
  },
})
