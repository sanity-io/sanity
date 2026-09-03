import {style} from '@vanilla-extract/css'

export const footerLink = style({
  selectors: {
    // `&&` (0,2,0) beats Text's own `& a { color: var(--card-link-color) }` rule (0,1,1)
    '&&': {
      color: 'inherit',
    },
  },
})
