import {createVar, style} from '@vanilla-extract/css'

export const bgVar = createVar()
export const blendModeVar = createVar()
export const radiusVar = createVar()
export const topVar = createVar()
export const leftVar = createVar()
export const widthVar = createVar()
export const heightVar = createVar()

export const highlightDiv = style({
  mixBlendMode: blendModeVar as any,
  borderRadius: radiusVar,
  top: topVar,
  left: leftVar,
  bottom: topVar,
  right: leftVar,
  pointerEvents: 'none',
  position: 'absolute',
  zIndex: 1,
  width: widthVar,
  height: heightVar,
  backgroundColor: bgVar,
})

export const fieldStack = style({
  selectors: {
    '&&': {
      position: 'relative',
    },
  },
})
