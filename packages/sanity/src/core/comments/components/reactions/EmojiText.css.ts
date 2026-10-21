import {style} from '@vanilla-extract/css'

export const emojiText = style({
  selectors: {
    '&&': {
      fontFamily:
        "'Twemoji Mozilla', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji', 'EmojiOne Color', 'Android Emoji', sans-serif",
    },
  },
})
