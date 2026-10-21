import {globalStyle, style} from '@vanilla-extract/css'

export const root = style({})

/* Hide on small screens */
globalStyle(`${root}${root}[data-eq-max~='0'] [data-ui='TabList']`, {
  display: 'none',
})

/* Hide on medium to large screens */
globalStyle(`${root}${root} [data-ui='Select']`, {
  display: 'none',
})

/* Show on small screens */
globalStyle(`${root}${root}[data-eq-max~='0'] [data-ui='Select']`, {
  display: 'block',
})
