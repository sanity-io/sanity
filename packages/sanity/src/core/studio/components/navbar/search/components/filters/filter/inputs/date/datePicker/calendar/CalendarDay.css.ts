import {createVar, style, globalStyle} from '@vanilla-extract/css'

export const borderColorVar = createVar()

export const circleSvg = style({
  bottom: 0,
  left: 0,
  position: 'absolute',
  right: 0,
  top: 0,
})

globalStyle(`.${circleSvg} circle`, {
  strokeWidth: 3,
  fill: 'none',
  stroke: borderColorVar,
})

export const customCard = style({
  selectors: {
    '&&': {
      position: 'relative',
    },
    '&&[data-focused="true"]': {
      zIndex: 1,
    },
    '&&[data-start-date="true"]': {
      borderTopRightRadius: 0,
      borderBottomRightRadius: 0,
    },
    '&&[data-end-date="true"]': {
      borderTopLeftRadius: 0,
      borderBottomLeftRadius: 0,
    },
    '&&[data-within-range="true"]': {
      borderRadius: 0,
    },
  },
})
