import {style} from '@vanilla-extract/css'

export const transparentCard = style({
  selectors: {
    // Doubled class to beat Card's own runtime-injected background styles,
    // which styled-components used to win on CSSOM insertion order alone.
    '&&': {
      background: 'none',
    },
  },
})
