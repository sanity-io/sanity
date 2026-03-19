import {createVar, style} from '@vanilla-extract/css'

export const heightVar = createVar()

export const incomingReferencesListContainer = style({
  selectors: {
    '&&': {
      height: heightVar,
    },
  },
})
