import {createVar, style} from '@vanilla-extract/css'

/** `color.fg` (the v1 `theme.sanity.color.base.fg`) */
export const cityColorVar = createVar()
/** `color.button.ghost.default.enabled.fg` (the v1 `theme.sanity.color.muted.default.enabled.fg`) */
export const offsetColorVar = createVar()
/** `color.input.default.readOnly.fg` */
export const alternativeNameColorVar = createVar()

export const timeZoneCitySpan = style({
  color: cityColorVar,
  fontWeight: 500,
  marginLeft: '1em',
})

export const timeZoneOffsetSpan = style({
  color: offsetColorVar,
  fontWeight: 500,
})

export const timeZoneAlternativeNameSpan = style({
  color: alternativeNameColorVar,
  float: 'right',
})
