import {style} from '@vanilla-extract/css'

export const svgWrapper = style({
  pointerEvents: 'none',
  position: 'absolute',
  left: 0,
  top: 0,
  right: 0,
  bottom: 0,
  width: '100%',
  height: '100%',
})
