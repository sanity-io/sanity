import {globalStyle, style} from '@vanilla-extract/css'

export const timeZoneButtonElementQuery = style({})

globalStyle(`${timeZoneButtonElementQuery} .button-small`, {
  display: 'block',
})

globalStyle(`${timeZoneButtonElementQuery} .button-large`, {
  display: 'none',
})

globalStyle(`${timeZoneButtonElementQuery}[data-eq-min~='2'] .button-small`, {
  display: 'none',
})

globalStyle(`${timeZoneButtonElementQuery}[data-eq-min~='2'] .button-large`, {
  display: 'block',
})
