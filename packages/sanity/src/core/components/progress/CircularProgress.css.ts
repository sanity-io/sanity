import {hues} from '@sanity/color'
import {style, styleVariants} from '@vanilla-extract/css'

export const SIZE = 43
export const STROKE_WIDTH = 3

export const root = style({
  width: `${SIZE}px`,
  height: `${SIZE}px`,
  transform: 'rotate(-90deg)',
})

/** Keyed by the color scheme (`color._dark`) */
export const bgCircle = styleVariants({
  light: {
    fill: 'none',
    stroke: hues.gray[100].hex,
    strokeWidth: `${STROKE_WIDTH}px`,
  },
  dark: {
    fill: 'none',
    stroke: hues.gray[900].hex,
    strokeWidth: `${STROKE_WIDTH}px`,
  },
})

/** Keyed by the color scheme (`color._dark`) */
export const progressCircle = styleVariants({
  light: {
    fill: 'none',
    stroke: hues.blue[500].hex,
    strokeWidth: `${STROKE_WIDTH}px`,
    transition: 'stroke-dashoffset 75ms',
  },
  dark: {
    fill: 'none',
    stroke: hues.blue[400].hex,
    strokeWidth: `${STROKE_WIDTH}px`,
    transition: 'stroke-dashoffset 75ms',
  },
})
