import {style} from '@vanilla-extract/css'

import {MOVING_ITEM_CLASS_NAME} from '../common/list.css'

export const footerFlex = style({
  selectors: {
    // `&&`: Flex (Box) sets `min-height: 0` itself
    '&&': {
      minHeight: '33px',
    },
  },
})

export const presenceFlex = style({
  position: 'absolute',
  top: 0,
  right: 0,
  height: '33px',
})

export const root = style({
  transition: 'border-color 250ms',
  boxSizing: 'border-box',
  position: 'relative',
  selectors: {
    // `&&:not([hidden])` (0,3,0) beats Card's own `&:not([hidden]) {display: block}` (0,2,0)
    // so `as={Flex}` keeps the cell stacking as a column.
    '&&:not([hidden])': {
      display: 'flex',
    },
    [`.${MOVING_ITEM_CLASS_NAME} &`]: {
      boxShadow: [
        '0 0 0 0',
        '0 8px 17px 2px var(--card-shadow-umbra-color)',
        '0 3px 14px 2px var(--card-shadow-penumbra-color)',
        '0 5px 5px -3px var(--card-shadow-ambient-color)',
      ].join(', '),
    },
    "&[aria-selected='true']": {
      boxShadow: '0 0 0 2px var(--card-focus-ring-color)',
    },
  },
})

export const dragHandleCard = style({
  'position': 'absolute',
  'top': 0,
  'left': 0,
  '@media': {
    '(hover: hover)': {
      selectors: {
        [`${root} &`]: {
          opacity: 0,
        },
        [`${root}:hover &, ${root}:focus-within &`]: {
          opacity: 1,
        },
      },
    },
  },
})
