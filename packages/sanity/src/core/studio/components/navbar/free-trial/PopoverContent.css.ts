import {style} from '@vanilla-extract/css'

export const image = style({
  objectFit: 'cover',
  width: '100%',
  // the original declared `height: 100%` followed by `height: 180px`; the latter won
  height: '180px',
})
