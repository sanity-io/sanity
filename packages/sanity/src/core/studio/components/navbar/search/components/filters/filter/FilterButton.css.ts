import {createVar, style} from '@vanilla-extract/css'

export const radiusVar = createVar()

export const closeButton = style({
  borderRadius: radiusVar,
})

export const closeCard = style({
  selectors: {
    '&&': {
      position: 'absolute',
      right: 0,
    },
  },
})

export const containerDiv = style({
  alignItems: 'center',
  display: 'inline-flex',
  maxWidth: '100%',
  position: 'relative',
})

export const labelButton = style({
  selectors: {
    '&&': {
      border: 'none',
      width: '100%',
    },
  },
})
