import {style} from '@vanilla-extract/css'

export const emojiText = style({
  selectors: {
    // `&&` beats ui5 Text's own `font` shorthand (`.sui-text-body*`, (0,1,0))
    '&&': {
      fontFamily:
        "'Twemoji Mozilla', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji', 'EmojiOne Color', 'Android Emoji', sans-serif",
    },
  },
})
