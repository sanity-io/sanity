import {style} from '@vanilla-extract/css'

export const hiddenOverlay = style({
  background: 'transparent',
  height: '100%',
  left: 0,
  position: 'fixed',
  top: 0,
  width: '100%',
  zIndex: -1,
})
