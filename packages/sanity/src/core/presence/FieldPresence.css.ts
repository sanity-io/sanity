import {globalStyle, style} from '@vanilla-extract/css'

import {AVATAR_SIZE} from './constants'

export const flexWrapper = style({
  selectors: {
    '&&': {
      display: 'flex',
    },
  },
})

globalStyle(`${flexWrapper} > div:first-child`, {
  flex: 1,
  minWidth: 0,
})

export const innerBox = style({
  selectors: {
    '&&': {
      display: 'flex',
      height: `${AVATAR_SIZE}px`,
      minWidth: '23px',
      verticalAlign: 'top',
    },
  },
})
