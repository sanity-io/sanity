import {style} from '@vanilla-extract/css'

import {MOVING_ITEM_CLASS_NAME} from '../common/list'

export const root = style({
  selectors: {
    '&&': {
      position: 'relative',
      border: '1px solid transparent',
      transition: 'border-color 250ms',
    },
    [`.${MOVING_ITEM_CLASS_NAME} &&`]: {
      borderColor: 'var(--card-shadow-umbra-color)',
      boxShadow:
        '0 0 0 0, 0 8px 17px 2px var(--card-shadow-umbra-color), 0 3px 14px 2px var(--card-shadow-penumbra-color), 0 5px 5px -3px var(--card-shadow-ambient-color)',
    },
    '&&:hover': {
      borderColor: 'var(--card-shadow-umbra-color)',
    },
    '&&[aria-selected="true"]': {
      borderColor: 'var(--card-focus-ring-color)',
    },
  },
})
