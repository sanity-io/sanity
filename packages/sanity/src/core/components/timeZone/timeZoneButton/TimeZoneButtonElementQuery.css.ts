import {globalStyle, style} from '@vanilla-extract/css'

export const timeZoneButtonElementQuery = style({})

const root = `${timeZoneButtonElementQuery}${timeZoneButtonElementQuery}`

globalStyle(`${root} .button-small`, {
  display: 'block',
})

globalStyle(`${root} .button-large`, {
  display: 'none',
})

globalStyle(`${root}[data-eq-min~='2'] .button-small`, {
  display: 'none',
})

globalStyle(`${root}[data-eq-min~='2'] .button-large`, {
  display: 'block',
})
