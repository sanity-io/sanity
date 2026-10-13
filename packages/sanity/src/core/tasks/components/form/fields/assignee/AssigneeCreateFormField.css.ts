import {createVar, globalStyle, style} from '@vanilla-extract/css'

/** `color.input.default.enabled.placeholder` */
export const inputPlaceholderColorVar = createVar()

export const focusableCard = style({
  selectors: {
    // Card sets `border: 0` on `&[data-as='button']` (0,2,0); the styled() wrapper only won by
    // injection order, so the border override needs one more class.
    "&&[data-as='button']": {
      border: '1px solid var(--card-border-color)',
      vars: {
        '--card-muted-fg-color': inputPlaceholderColorVar,
      },
    },
    "&&[data-as='button']:focus-within": {
      border: '1px solid var(--card-focus-ring-color)',
    },
  },
})

// Set on the Text itself: it defines both variables, so values inherited from the card never apply
globalStyle(`${focusableCard}${focusableCard}[data-as='button'][data-selected] [data-ui='Text']`, {
  vars: {
    '--text-color-muted': 'light-dark(var(--blue-200), var(--blue-800))',
    '--text-color': 'light-dark(var(--white), var(--black))',
  },
})
