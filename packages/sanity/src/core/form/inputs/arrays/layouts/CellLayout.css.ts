import {css} from '#styled-system/css'

export const footerFlex = css({
  // `&&`: Flex (Box) sets `min-height: 0` itself
  '&&': {
    minHeight: '33px',
  },
})

export const presenceFlex = css({
  position: 'absolute',
  top: 0,
  right: 0,
  height: '33px',
})

export const root = css({
  'transition': 'border-color 250ms',
  'boxSizing': 'border-box',
  'position': 'relative',
  // The Card renders as the ui5 Flex; until Card is migrated, its own `&:not([hidden])
  // {display: block}` (0,2,0) would override the Flex, so the flex display is asserted one
  // class higher.
  '&&:not([hidden])': {
    display: 'flex',
  },
  // The item being dragged, see `ListItem` in `../common/list.tsx`
  '[data-array-item-moving] &': {
    boxShadow:
      '0 0 0 0, 0 8px 17px 2px var(--card-shadow-umbra-color), 0 3px 14px 2px var(--card-shadow-penumbra-color), 0 5px 5px -3px var(--card-shadow-ambient-color)',
  },
  // `&&`: the selected ring wins over the moving shadow, which it followed
  "&&[aria-selected='true']": {
    boxShadow: '0 0 0 2px var(--card-focus-ring-color)',
  },
})

export const dragHandleCard = css({
  'position': 'absolute',
  'top': 0,
  'left': 0,
  // `data-cell-layout` is rendered by the element with the `root` class
  '@media (hover: hover)': {
    '[data-cell-layout] &': {
      opacity: 0,
    },
    '[data-cell-layout]:hover &, [data-cell-layout]:focus-within &': {
      opacity: 1,
    },
  },
})
