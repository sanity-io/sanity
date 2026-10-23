import {css} from '#styled-system/css'

/** `color.button.ghost[tone].enabled.fg` for the chip's tone, read from the theme by `ChipCard`. */
export const chipFgColorVar = '--link-to-canvas-diff-chip-fg-color'

/** Card sets `--card-fg-color` on itself at (0,1,0); `&&` outranks it regardless of sheet order. */
export const chipCard = css({
  '&&': {
    '--card-fg-color': `var(${chipFgColorVar})`,
  },
})
