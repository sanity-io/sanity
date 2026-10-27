import {css} from '#styled-system/css'

export const SIZE = 43
export const STROKE_WIDTH = 3

export const root = css({
  width: `${SIZE}px`,
  height: `${SIZE}px`,
  transform: 'rotate(-90deg)',
})

/** Keyed by the color scheme (`color._dark`) */
export const bgCircle = {
  light: css({
    fill: 'none',
    // hues.gray[100]
    stroke: '#eeeef1',
    strokeWidth: `${STROKE_WIDTH}px`,
  }),
  dark: css({
    fill: 'none',
    // hues.gray[900]
    stroke: '#1b1d27',
    strokeWidth: `${STROKE_WIDTH}px`,
  }),
}

/** Keyed by the color scheme (`color._dark`) */
export const progressCircle = {
  light: css({
    fill: 'none',
    // hues.blue[500]
    stroke: '#556bfc',
    strokeWidth: `${STROKE_WIDTH}px`,
    transition: 'stroke-dashoffset 75ms',
  }),
  dark: css({
    fill: 'none',
    // hues.blue[400]
    stroke: '#7595ff',
    strokeWidth: `${STROKE_WIDTH}px`,
    transition: 'stroke-dashoffset 75ms',
  }),
}
