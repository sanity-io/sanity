import {style} from '@vanilla-extract/css'
import {vars} from '@sanity/ui/css'

export const timeZoneCityStyle = style({
  color: vars.color.fg,
  fontWeight: 500,
  marginLeft: '1em',
})

export const timeZoneOffsetStyle = style({
  color: vars.color.tinted.default.fg[0],
  fontWeight: 500,
})

export const timeZoneAlternativeNameStyle = style({
  color: vars.color.tinted.default.fg[4],
  float: 'right',
})
