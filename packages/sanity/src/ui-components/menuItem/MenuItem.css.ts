import {style} from '@vanilla-extract/css'

export const subtitleText = style({
  selectors: {
    '&&': {
      marginTop: '2px',
    },
  },
})

export const previewWrapper = style({
  selectors: {
    '&&': {
      height: '25px',
      width: '25px',
      overflow: 'hidden',
    },
  },
})
