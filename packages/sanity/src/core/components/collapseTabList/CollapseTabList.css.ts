import {style} from '@vanilla-extract/css'

export const optionObserveElementStyle = style({
  listStyle: 'none',
  whiteSpace: 'nowrap',
  flexShrink: 0,
  opacity: 0,
  visibility: 'hidden',
})

export const hiddenRowStyle = style({
  opacity: 0,
  height: '0.1px',
  overflow: 'hidden',
})
