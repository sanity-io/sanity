import {css} from '#styled-system/css'

export const menuItem = css({
  /* Change the border color variable used by BlockQuote
to make the border visible when the MenuItem is selected */
  "&[data-selected] [data-option='blockquote']": {
    '--card-border-color': 'var(--card-muted-fg-color)',
  },
})
