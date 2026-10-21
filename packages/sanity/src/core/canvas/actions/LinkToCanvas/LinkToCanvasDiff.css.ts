import {createVar, style} from '@vanilla-extract/css'

/** `color.button.ghost[tone].enabled.fg` for the chip's tone, read from the theme by `ChipCard`. */
export const chipFgColorVar = createVar()

export const chipCard = style({
  selectors: {
    '&&': {
      vars: {'--card-fg-color': chipFgColorVar},
    },
  },
})
