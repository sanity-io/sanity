import {createVar, style} from '@vanilla-extract/css'

// font.text.weights.regular
export const fontWeightRegularVar = createVar()
// color.selectable.default.hovered.bg (legacy `theme.sanity.color.card.hovered.bg`)
export const hoveredBgVar = createVar()
// color.selectable.caution.pressed.bg
export const cautionPressedBgVar = createVar()

export const span = style({
  fontWeight: fontWeightRegularVar,
  color: 'var(--card-link-fg-color)',
  borderRadius: '2px',
  backgroundColor: hoveredBgVar,
  padding: '1px',
  boxSizing: 'border-box',

  selectors: {
    "&[data-active='true']": {
      backgroundColor: cautionPressedBgVar,
    },
  },
})
