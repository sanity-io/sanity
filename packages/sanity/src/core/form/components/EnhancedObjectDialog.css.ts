import {globalStyle, style} from '@vanilla-extract/css'

export const styledDialog = style({})

globalStyle(`${styledDialog}[data-hidden='true']`, {
  background: 'transparent',
})

globalStyle(`${styledDialog}[data-hidden='true'] [data-ui='DialogCard']`, {
  opacity: 0,
  pointerEvents: 'none',
  transform: 'scale(0.95)',
})
