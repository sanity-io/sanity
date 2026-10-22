import {css} from '#styled-system/css'

export const radius2Var = '--recent-search-item-radius-2'

export const recentSearchItemButton = css({
  // Button sets these declarations itself
  '&&': {
    borderRadius: `var(${radius2Var})`,
    cursor: 'default',
    width: '100%',
  },
})

export const searchItemPillsBox = css({
  flexShrink: 3,
})

export const searchItemQueryFlex = css({
  flexShrink: 2,
})

export const closeButtonDiv = css({
  'opacity': 0.8,
  'visibility': 'hidden',
  '@media (hover: hover)': {
    // `data-recent-search-item` is rendered by the `recentSearchItemButton` button
    '[data-recent-search-item]:hover &': {
      visibility: 'visible',
    },
    '&:hover': {
      opacity: 0.4,
    },
  },
})
