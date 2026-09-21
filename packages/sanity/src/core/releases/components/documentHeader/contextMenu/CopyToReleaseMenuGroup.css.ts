import {globalStyle, style} from '@vanilla-extract/css'

export const releasesList = style({
  maxWidth: '300px',
  maxHeight: '200px',
  overflowY: 'auto',
})

globalStyle(`${releasesList} > *`, {
  flexShrink: 0,
})
