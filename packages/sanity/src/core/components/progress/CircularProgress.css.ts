import {createVar, style} from '@vanilla-extract/css'

const SIZE = 43
const STROKE_WIDTH = 3

export const bgStrokeVar = createVar()
export const progressStrokeVar = createVar()

export const root = style({
  width: `${SIZE}px`,
  height: `${SIZE}px`,
  transform: 'rotate(-90deg)',
})

export const bgCircle = style({
  fill: 'none',
  stroke: bgStrokeVar,
  strokeWidth: `${STROKE_WIDTH}px`,
})

export const progressCircle = style({
  fill: 'none',
  stroke: progressStrokeVar,
  strokeWidth: `${STROKE_WIDTH}px`,
  transition: 'stroke-dashoffset 75ms',
})
