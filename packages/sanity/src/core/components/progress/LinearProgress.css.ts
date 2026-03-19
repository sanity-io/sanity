import {createVar, style} from '@vanilla-extract/css'

const STROKE_WIDTH = 0.5

export const barColorVar = createVar()

export const rootStyle = style({
  selectors: {
    '&&': {
      overflow: 'hidden',
    },
  },
})

export const barStyle = style({
  selectors: {
    '&&': {
      height: `${STROKE_WIDTH}rem`,
      background: barColorVar,
      transition: 'transform 75ms',
    },
  },
})
