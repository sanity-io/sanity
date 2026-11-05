import {css} from '#styled-system/css'

export const circleStrokeVar = '--calendar-day-circle-stroke'

export const circleSvg = css({
  bottom: 0,
  left: 0,
  position: 'absolute',
  right: 0,
  top: 0,
})

export const circle = css({
  stroke: `var(${circleStrokeVar})`,
  strokeWidth: '3',
  fill: 'none',
})

export const customCard = css({
  'position': 'relative',
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
})
