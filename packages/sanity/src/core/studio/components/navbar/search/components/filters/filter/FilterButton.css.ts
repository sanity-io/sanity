import {createVar, style} from '@vanilla-extract/css'

export const radius2Var = createVar()

export const closeButton = style({
  selectors: {
    '&&': {
      borderRadius: `0 ${radius2Var} ${radius2Var} 0`,
    },
  },
})

export const closeCard = style({
  position: 'absolute',
  right: 0,
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
