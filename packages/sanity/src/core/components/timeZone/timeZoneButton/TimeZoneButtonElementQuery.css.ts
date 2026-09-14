import {globalStyle, style} from '@vanilla-extract/css'

export const timeZoneButtonElementQuery = style({})

// `.button-small` / `.button-large` are ui5 Boxes, whose own
// `.sui-display-block:not([hidden]) {display: block}` (0,2,0) lives in a static stylesheet with no
// guaranteed order relative to this one. The runtime-injected rule used to win that tie by
// insertion order; doubling the root class wins it by specificity instead.
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
