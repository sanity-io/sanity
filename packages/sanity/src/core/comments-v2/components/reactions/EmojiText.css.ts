import {css} from '#styled-system/css'

export const emojiText = css({
  // Text sets `font` (which includes font-family) on itself
  '&&': {
    fontFamily: `'Twemoji Mozilla', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji', 'EmojiOne Color', 'Android Emoji', sans-serif`,
  },
})
