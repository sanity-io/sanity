import {createVar, globalStyle, style} from '@vanilla-extract/css'

// data-active = when the comment is selected
// data-hovered = when the mouse is over the comment
export const styledThreadCard = style({
  position: 'relative',
  selectors: {
    "&:has(> [data-ui='GhostButton']:focus:focus-visible)": {
      boxShadow: `inset 0 0 0 1px var(--card-border-color),
        0 0 0 1px var(--card-bg-color),
        0 0 0 2px var(--card-focus-ring-color)`,
    },
  },
})

// The hover styles is managed with the [data-hovered] attribute instead of the :hover pseudo class
// since we want to show the hover styles when hovering over the menu items in the context menu as well.
// The context menu is rendered using a portal, so the :hover pseudo class won't work when hovering over
// the menu items.
globalStyle(
  `${styledThreadCard}:not([data-active='true'])[data-hovered='true'] [data-root-menu='true']`,
  {
    '@media': {
      '(hover: hover)': {
        opacity: 1,
      },
    },
  },
)

/** `theme.font.text.weights.medium` */
export const fontWeightMediumVar = createVar()

export const expandButton = style({
  selectors: {
    // `&&` beats Button's own `font: inherit`
    '&&': {
      fontWeight: fontWeightMediumVar,
    },
  },
})

export const ghostButton = style({
  opacity: 0,
  position: 'absolute',
  right: 0,
  top: 0,
  bottom: 0,
  left: 0,
})
