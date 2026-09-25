import {style} from '@vanilla-extract/css'

// TextArea spreads `className` onto its inner `<textarea data-as="textarea">`, whose own
// `&[data-as='textarea'] {resize: none}` rule is (0,2,0); `&&` makes this (0,3,0).
export const textArea = style({
  selectors: {
    "&&[data-as='textarea']": {
      resize: 'vertical',
    },
  },
})
