import {createVar, style} from '@vanilla-extract/css'

/** `color.selectable[$toneKey].enabled.bg` */
export const bgColorVar = createVar()
/** `color.selectable[$toneKey].enabled.fg` */
export const fgColorVar = createVar()
/** `color._dark ? hues.purple[950].hex : hues.purple[50].hex` */
export const customMarkersBgColorVar = createVar()
/** `color.button.ghost.caution.hovered.bg` (the legacy theme's `color.muted.caution.hovered.bg`) */
export const warningBgColorVar = createVar()
/** `color.button.ghost.critical.hovered.bg` (the legacy theme's `color.muted.critical.hovered.bg`) */
export const errorBgColorVar = createVar()

export const root = style({
  textDecoration: 'none',
  display: 'inline',
  backgroundColor: bgColorVar,
  borderBottom: `1px dashed ${fgColorVar}`,
  color: fgColorVar,
  selectors: {
    '&[data-link]': {
      borderBottom: `1px solid ${fgColorVar}`,
    },
    '&[data-custom-markers]': {
      backgroundColor: customMarkersBgColorVar,
    },
    '&[data-warning]': {
      backgroundColor: warningBgColorVar,
    },
    '&[data-error]': {
      backgroundColor: errorBgColorVar,
    },
  },
})

export const tooltipBox = style({
  maxWidth: '250px',
})
