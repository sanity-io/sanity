import {createVar, style} from '@vanilla-extract/css'

export const radius2Var = createVar()

export const recentSearchItemButton = style({
  cursor: 'default',
  width: '100%',
  selectors: {
    // Button sets border-radius itself (radius prop, default 2)
    '&&': {
      borderRadius: radius2Var,
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
