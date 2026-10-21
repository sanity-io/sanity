import {createVar, globalStyle, style} from '@vanilla-extract/css'

/** `color.input.default.enabled.placeholder` */
export const inputPlaceholderColorVar = createVar()

export const focusableCard = style({
  selectors: {
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

globalStyle(`${focusableCard}${focusableCard}[data-as='button'][data-selected] [data-ui='Text']`, {
  vars: {
    '--text-color-muted': 'light-dark(var(--blue-200), var(--blue-800))',
    '--text-color': 'light-dark(var(--white), var(--black))',
  },
})
