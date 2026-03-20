import {style, globalStyle} from '@vanilla-extract/css'

export const monogramContainer = style({
  selectors: {
    '&&': {
      overflow: 'hidden',
      height: '75px',
      width: '75px',
    },
  },
})

export const truncateBadge = style({
  selectors: {
    '&&': {
      display: 'block',
    },
  },
})

globalStyle(`.${truncateBadge} span`, {
  display: 'block',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  overflow: 'clip',
})
