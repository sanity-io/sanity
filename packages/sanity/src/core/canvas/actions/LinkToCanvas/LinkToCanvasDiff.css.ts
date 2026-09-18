import {createVar, style} from '@vanilla-extract/css'

/** `color.button.ghost[tone].enabled.fg` for the chip's tone, read from the theme by `ChipCard`. */
export const chipFgColorVar = createVar()

/** Card sets `--card-fg-color` on itself at (0,1,0); `&&` outranks it regardless of sheet order. */
export const chipCard = style({
  selectors: {
    '&&': {
      vars: {'--card-fg-color': chipFgColorVar},
    },
  },
})
