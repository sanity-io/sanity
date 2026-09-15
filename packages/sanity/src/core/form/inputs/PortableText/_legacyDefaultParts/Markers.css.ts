import {createVar, style} from '@vanilla-extract/css'

/** `color.button.ghost.primary.enabled.fg` (the legacy theme's `color.muted.primary.enabled.fg`) */
export const infoFgColorVar = createVar()
/** `color.button.ghost.caution.enabled.fg` (the legacy theme's `color.muted.caution.enabled.fg`) */
export const warningFgColorVar = createVar()
/** `color.button.ghost.critical.enabled.fg` (the legacy theme's `color.muted.critical.enabled.fg`) */
export const errorFgColorVar = createVar()

export const iconText = style({
  selectors: {
    '&[data-info]': {
      color: infoFgColorVar,
    },
    '&[data-warning]': {
      color: warningFgColorVar,
    },
    '&[data-error]': {
      color: errorFgColorVar,
    },
  },
})
