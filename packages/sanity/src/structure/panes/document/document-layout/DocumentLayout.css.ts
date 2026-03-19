import {style} from '@vanilla-extract/css'

export const styledChangeConnectorRoot = style({
  selectors: {
    '&&': {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      minHeight: 0,
      minWidth: 0,
    },
  },
})
