import {style} from '@vanilla-extract/css'

export const textArea = style({
  selectors: {
    "&&[data-as='textarea']": {
      resize: 'vertical',
    },
  },
})
