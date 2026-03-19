import {style} from '@vanilla-extract/css'

export const textInput = style({
  selectors: {
    '&&[data-as="textarea"]': {
      resize: 'vertical',
    },
  },
})
