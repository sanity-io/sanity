import {style} from '@vanilla-extract/css'

export const titleButton = style({
  selectors: {
    '&&': {
      width: '100%',
      maxWidth: '100%',
    },
  },
})

export const taskDetailsRoot = style({
  selectors: {
    '&&': {
      /* Checkbox width is 17px and first row gap is 12px. */
      marginLeft: '29px',
    },
  },
})
