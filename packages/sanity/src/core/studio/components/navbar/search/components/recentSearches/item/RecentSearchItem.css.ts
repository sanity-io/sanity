import {createVar, style} from '@vanilla-extract/css'

export const radius2Var = createVar()

export const recentSearchItemButton = style({
  selectors: {
    // Button sets these declarations itself
    '&&': {
      borderRadius: radius2Var,
      cursor: 'default',
      width: '100%',
    },
  },
})

export const searchItemPillsBox = style({
  flexShrink: 3,
})

export const searchItemQueryFlex = style({
  flexShrink: 2,
})

export const closeButtonDiv = style({
  'opacity': 0.8,
  'visibility': 'hidden',
  '@media': {
    '(hover: hover)': {
      selectors: {
        [`${recentSearchItemButton}:hover &`]: {
          visibility: 'visible',
        },
        '&:hover': {
          opacity: 0.4,
        },
      },
    },
  },
})
