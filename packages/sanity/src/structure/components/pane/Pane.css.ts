import {style} from '@vanilla-extract/css'

export const root = style({
  selectors: {
    '&&': {
      outline: 'none',
      // NOTE: This will render a border to the right side of each pane
      // without taking up physical space.
      boxShadow: '1px 0 0 var(--card-border-color)',
    },
  },
})
