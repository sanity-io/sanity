import {createVar, style} from '@vanilla-extract/css'

export const radiusVar = createVar()

export const recentSearchItemButton = style({
  borderRadius: radiusVar,
  cursor: 'default',
  width: '100%',
})

export const searchItemPillsBox = style({
  selectors: {
    '&&': {
      flexShrink: 3,
    },
  },
})

export const searchItemQueryFlex = style({
  selectors: {
    '&&': {
      flexShrink: 2,
    },
  },
})

export const closeButtonDiv = style({
  'opacity': 0.8,
  'visibility': 'hidden',
  'selectors': {
    [`.${recentSearchItemButton}:hover &`]: {
      visibility: 'visible',
    },
    '&:hover': {
      opacity: 0.4,
    },
  },
  '@media': {
    '(hover: none)': {
      visibility: 'hidden',
    },
  },
})
