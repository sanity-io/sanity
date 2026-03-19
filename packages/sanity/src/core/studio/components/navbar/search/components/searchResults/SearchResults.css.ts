import {createVar, style} from '@vanilla-extract/css'

export const loadingOpacityVar = createVar()

export const searchResultsInnerFlex = style({
  selectors: {
    '&&': {
      opacity: loadingOpacityVar,
      overflowX: 'hidden',
      overflowY: 'auto',
      position: 'relative',
      transition: '300ms opacity',
      width: '100%',
    },
  },
})
