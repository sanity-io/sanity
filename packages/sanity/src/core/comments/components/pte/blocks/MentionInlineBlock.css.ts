import {css} from '#styled-system/css'

/** `font.text.weights.regular` (v1 `fonts.text.weights.regular`) */
export const fontWeightRegularVar = '--mention-inline-block-font-weight-regular'
/** `color.selectable.default.hovered.bg` (v1 `color.card.hovered.bg`) */
export const hoveredBgVar = '--mention-inline-block-hovered-bg'
/** `color.selectable.caution.pressed.bg` */
export const cautionPressedBgVar = '--mention-inline-block-caution-pressed-bg'

export const span = css({
  'fontWeight': `var(${fontWeightRegularVar})`,
  'color': 'var(--card-link-fg-color)',
  'borderRadius': '2px',
  'backgroundColor': `var(${hoveredBgVar})`,
  'padding': '1px',
  'boxSizing': 'border-box',
  "&[data-active='true']": {
    backgroundColor: `var(${cautionPressedBgVar})`,
  },
})
