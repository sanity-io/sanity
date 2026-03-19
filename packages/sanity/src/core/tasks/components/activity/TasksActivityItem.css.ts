import {style} from '@vanilla-extract/css'

export const activityChildrenRoot = style({
  selectors: {
    '&&': {
      height: '100%',
    },
  },
})

export const activityItemChildrenContainer = style({
  width: '100%',
})
