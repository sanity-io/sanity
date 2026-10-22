import {css} from '#styled-system/css'

/** `color.fg` (the v1 `theme.sanity.color.base.fg`) */
export const cityColorVar = '--dialog-time-zone-city-color'
/** `color.button.ghost.default.enabled.fg` (the v1 `theme.sanity.color.muted.default.enabled.fg`) */
export const offsetColorVar = '--dialog-time-zone-offset-color'
/** `color.input.default.readOnly.fg` */
export const alternativeNameColorVar = '--dialog-time-zone-alternative-name-color'

export const timeZoneCitySpan = css({
  color: `var(${cityColorVar})`,
  fontWeight: 500,
  marginLeft: '1em',
})

export const timeZoneOffsetSpan = css({
  color: `var(${offsetColorVar})`,
  fontWeight: 500,
})

export const timeZoneAlternativeNameSpan = css({
  color: `var(${alternativeNameColorVar})`,
  float: 'right',
})
