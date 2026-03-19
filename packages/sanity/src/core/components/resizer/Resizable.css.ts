import {style} from '@vanilla-extract/css'

export const rootStyle = style({
  selectors: {
    '&&': {
      position: 'relative',
      flex: 1,
      paddingLeft: '1px',
    },
  },
})
