import {createVar, style} from '@vanilla-extract/css'

/**
 * `color.fg` read from the theme at the logo's position (was `theme.sanity.color.base.fg`). Not
 * `var(--card-fg-color)`: the logo renders inside a Button, whose own `--card-fg-color` follows its
 * hover/pressed state, while the original value was fixed to the surrounding card's foreground.
 */
export const githubLogoFillVar = createVar()

export const githubLogo = style({
  fill: githubLogoFillVar,
})

export const customImage = style({
  height: '19px',
  width: '19px',
  objectFit: 'contain',
})
