import {createVar, style} from '@vanilla-extract/css'

export const fgColorVar = createVar()
export const mutedFgColorVar = createVar()
export const readOnlyFgColorVar = createVar()

export const timeZoneCitySpan = style({
  color: fgColorVar,
  fontWeight: 500,
  marginLeft: '1em',
})

export const timeZoneOffsetSpan = style({
  color: mutedFgColorVar,
  fontWeight: 500,
})

export const timeZoneAlternativeNameSpan = style({
  color: readOnlyFgColorVar,
  float: 'right',
})
