import {style} from '@vanilla-extract/css'

import {MOVING_ITEM_CLASS_NAME} from '../common/list'

export const footerFlex = style({
  selectors: {
    '&&': {
      minHeight: '33px',
    },
  },
})

export const presenceFlex = style({
  selectors: {
    '&&': {
      position: 'absolute',
      top: 0,
      right: 0,
      height: '33px',
    },
  },
})

export const root = style({
  selectors: {
    '&&': {
      transition: 'border-color 250ms',
      boxSizing: 'border-box',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
    },
    [`.${MOVING_ITEM_CLASS_NAME} &&`]: {
      boxShadow:
        '0 0 0 0, 0 8px 17px 2px var(--card-shadow-umbra-color), 0 3px 14px 2px var(--card-shadow-penumbra-color), 0 5px 5px -3px var(--card-shadow-ambient-color)',
    },
    '&&[aria-selected="true"]': {
      boxShadow: '0 0 0 2px var(--card-focus-ring-color)',
    },
  },
})

export const dragHandleCard = style({
  'selectors': {
    '&&': {
      position: 'absolute',
      top: 0,
      left: 0,
    },
  },
  '@media': {
    '(hover: hover)': {
      selectors: {
        [`${root} &&`]: {
          opacity: 0,
        },
        [`${root}:hover &&`]: {
          opacity: 1,
        },
        [`${root}:focus-within &&`]: {
          opacity: 1,
        },
      },
    },
  },
})
