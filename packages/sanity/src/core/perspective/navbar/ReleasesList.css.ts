import {style} from '@vanilla-extract/css'

// Card sets `background-color` on its own class; the doubled class wins that tie by specificity
// the way the runtime-injected wrapper used to by insertion order.
const stickyCard = style({
  position: 'sticky',
  zIndex: 2,
  selectors: {
    '&&': {
      background: 'var(--card-bg-color)',
    },
  },
})

export const stickyTopCard = style([stickyCard, {top: 0}])

export const stickyBottomCard = style([stickyCard, {bottom: 0}])
