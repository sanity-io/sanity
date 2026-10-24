import {css} from '#styled-system/css'

/** `color.selectable[$toneKey].enabled.bg` */
export const bgColorVar = '--annotation-bg-color'
/** `color.selectable[$toneKey].enabled.fg` */
export const fgColorVar = '--annotation-fg-color'
/** `color._dark ? hues.purple[950].hex : hues.purple[50].hex` */
export const customMarkersBgColorVar = '--annotation-custom-markers-bg-color'
/** `color.button.ghost.caution.hovered.bg` (the legacy theme's `color.muted.caution.hovered.bg`) */
export const warningBgColorVar = '--annotation-warning-bg-color'
/** `color.button.ghost.critical.hovered.bg` (the legacy theme's `color.muted.critical.hovered.bg`) */
export const errorBgColorVar = '--annotation-error-bg-color'

export const root = css({
  'textDecoration': 'none',
  'display': 'inline',
  'backgroundColor': `var(${bgColorVar})`,
  'borderBottom': `1px dashed var(${fgColorVar})`,
  'color': `var(${fgColorVar})`,
  '&[data-link]': {
    borderBottom: `1px solid var(${fgColorVar})`,
  },
  // An error wins over a warning, and both over the custom markers; `:where()` keeps the
  // specificity of each rule as it was
  '&[data-custom-markers]:where(:not([data-warning], [data-error]))': {
    backgroundColor: `var(${customMarkersBgColorVar})`,
  },
  '&[data-warning]:where(:not([data-error]))': {
    backgroundColor: `var(${warningBgColorVar})`,
  },
  '&[data-error]': {
    backgroundColor: `var(${errorBgColorVar})`,
  },
})

export const tooltipBox = css({
  maxWidth: '250px',
})
