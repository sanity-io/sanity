import {createVar, style} from '@vanilla-extract/css'

/** `color.input.default.enabled.placeholder` */
export const inputPlaceholderColorVar = createVar()

export const focusableCard = style({
  selectors: {
    // Card sets `border: 0` on `&[data-as='button']` (0,2,0); the styled() wrapper only won by
    // injection order, so the border override needs one more class.
    "&&[data-as='button']": {
      border: '1px solid var(--card-border-color)',
    },
    "&&[data-as='button']:focus-within": {
      border: '1px solid var(--card-focus-ring-color)',
    },
    "&[data-as='button']": {
      vars: {
        '--card-muted-fg-color': inputPlaceholderColorVar,
      },
    },
  },
})
