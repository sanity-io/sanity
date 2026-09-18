import {style} from '@vanilla-extract/css'

/** Sets the suggest-tone icon color via the card icon CSS variable. */
export const suggestIconColor = style({
  vars: {
    '--card-icon-color': 'var(--card-badge-suggest-icon-color)',
  },
})
