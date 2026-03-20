import {createVar, style} from '@vanilla-extract/css'

export const opacityVar = createVar()

export const rootBox = style({
  selectors: {
    '&&': {
      position: 'relative',
      opacity: opacityVar,
      transition: 'opacity 0.4s',
    },
  },
})

export const commandListBox = style({
  selectors: {
    '&&': {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
    },
  },
})
