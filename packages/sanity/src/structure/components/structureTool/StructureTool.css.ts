import {style} from '@vanilla-extract/css'

export const styledPaneLayout = style({
  selectors: {
    '&&': {
      minHeight: '100%',
      minWidth: '320px',
    },
  },
})
