import {style} from '@vanilla-extract/css'
import {vars} from '@sanity/ui/css'

const SIZE = 43
const STROKE_WIDTH = 3

export const rootStyle = style({
  width: `${SIZE}px`,
  height: `${SIZE}px`,
  transform: 'rotate(-90deg)',
})

export const bgCircleStyle = style({
  fill: 'none',
  stroke: vars.color.tinted.default.border[0],
  strokeWidth: `${STROKE_WIDTH}px`,
})

export const progressCircleStyle = style({
  fill: 'none',
  stroke: vars.color.solid.primary.bg[0],
  strokeWidth: `${STROKE_WIDTH}px`,
  transition: 'stroke-dashoffset 75ms',
})
