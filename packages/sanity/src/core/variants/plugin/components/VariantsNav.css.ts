import {style} from '@vanilla-extract/css'

/** Sets the suggest-tone icon color via the card icon CSS variable. */
export const suggestIconColor = style({
  vars: {
    '--card-icon-color': 'var(--card-badge-suggest-icon-color)',
  },
})

/** Spacer to align section headers with menu item icons. */
export const menuIconSpacer = style({
  width: 15,
})
