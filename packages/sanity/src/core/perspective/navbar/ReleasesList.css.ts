import {style} from '@vanilla-extract/css'

export const stickyCard = style({
  selectors: {
    '&&': {
      position: 'sticky',
      zIndex: 2,
      background: 'var(--card-bg-color)',
    },
  },
})

export const stickyTopCard = style([stickyCard, {
  selectors: {
    '&&': {
      top: 0,
    },
  },
}])

export const stickyBottomCard = style([stickyCard, {
  selectors: {
    '&&': {
      bottom: 0,
    },
  },
}])
