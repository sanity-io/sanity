import {createVar, style} from '@vanilla-extract/css'

export const borderRadiusVar = createVar()
export const topVar = createVar()
export const bottomVar = createVar()
export const leftVar = createVar()
export const rightVar = createVar()
export const bgVar = createVar()

export const reviewChangesHighlightBlock = style({
  position: 'absolute',
  borderRadius: borderRadiusVar,
  top: topVar,
  bottom: bottomVar,
  left: leftVar,
  right: rightVar,
  backgroundColor: bgVar,
  pointerEvents: 'none',
})
