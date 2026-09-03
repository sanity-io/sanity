import {createVar, style} from '@vanilla-extract/css'

export const circleStrokeVar = createVar()

export const circleSvg = style({
  bottom: 0,
  left: 0,
  position: 'absolute',
  right: 0,
  top: 0,
})

export const circle = style({
  stroke: circleStrokeVar,
  strokeWidth: '3',
  fill: 'none',
})

export const customCard = style({
  position: 'relative',
  selectors: {
    "&[data-focused='true']": {
      zIndex: 1,
    },
    "&[data-start-date='true']": {
      borderTopRightRadius: 0,
      borderBottomRightRadius: 0,
    },
    "&[data-end-date='true']": {
      borderTopLeftRadius: 0,
      borderBottomLeftRadius: 0,
    },
    "&[data-within-range='true']": {
      borderRadius: 0,
    },
  },
})
