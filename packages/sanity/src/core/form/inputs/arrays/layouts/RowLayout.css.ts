import {css} from '#styled-system/css'

export const root = css({
  'position': 'relative',
  'border': '1px solid transparent',
  'transition': 'border-color 250ms',
  // The item being dragged, see `ListItem` in `../common/list.tsx`
  '[data-array-item-moving] &': {
    borderColor: 'var(--card-shadow-umbra-color)',
    boxShadow:
      '0 0 0 0, 0 8px 17px 2px var(--card-shadow-umbra-color), 0 3px 14px 2px var(--card-shadow-penumbra-color), 0 5px 5px -3px var(--card-shadow-ambient-color)',
  },
  '&:hover': {
    borderColor: 'var(--card-shadow-umbra-color)',
  },
  // `&&`: the selected border wins over the hover and moving ones, which it followed
  "&&[aria-selected='true']": {
    borderColor: 'var(--card-focus-ring-color)',
  },
})
