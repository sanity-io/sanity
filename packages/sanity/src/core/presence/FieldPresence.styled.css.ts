import {globalStyle, style} from '@vanilla-extract/css'

import {AVATAR_SIZE} from './constants'

export const flexWrapper = style({})

globalStyle(`${flexWrapper} > div:first-child`, {
  flex: 1,
  minWidth: 0,
})

export const innerBox = style({
  height: `${AVATAR_SIZE}px`,
  verticalAlign: 'top',
  selectors: {
    '&&': {
      minWidth: '23px',
    },
  },
})
