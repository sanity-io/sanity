import {createVar, style} from '@vanilla-extract/css'

export const radius2Var = createVar()

export const closeButton = style({
  selectors: {
    // Override the border-radius @sanity/ui's Button sets from its `radius` prop
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
  width: '100%',
  selectors: {
    // Override the `border: 0` @sanity/ui's Button sets on itself
    '&&': {
      border: 'none',
    },
  },
})
