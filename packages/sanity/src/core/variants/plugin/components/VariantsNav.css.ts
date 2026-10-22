import {css} from '#styled-system/css'

/** Sets the suggest-tone icon color via the card icon CSS variable. */
export const suggestIconColor = css({
  '--icon-color': 'var(--card-badge-suggest-icon-color)',
})

/** Spacer to align section headers with menu item icons. */
export const menuIconSpacer = css({
  width: 15,
})
