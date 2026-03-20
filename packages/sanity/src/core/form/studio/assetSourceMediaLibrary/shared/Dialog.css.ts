import {globalStyle, style} from '@vanilla-extract/css'

export const appDialog = style({
  selectors: {
    '&&': {
      padding: '1.5rem',
    },
  },
})

globalStyle(`${appDialog} [data-ui='Card']:first-child`, {
  flex: 1,
})
