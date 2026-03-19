import {globalStyle, style} from '@vanilla-extract/css'

export const root = style({})

globalStyle(`${root}[data-eq-max~="0"] [data-ui="TabList"]`, {
  display: 'none',
})

globalStyle(`${root} [data-ui="Select"]`, {
  display: 'none',
})

globalStyle(`${root}[data-eq-max~="0"] [data-ui="Select"]`, {
  display: 'block',
})
