import {css} from '#styled-system/css'

export const changedFieldTitles = css({
  // Doubled to beat the color of ui5's `Text`, and read from the card so it follows the tone of a
  // selected card, which a ui5 `Text` doesn't on its own.
  '&&': {
    color: 'var(--card-muted-fg-color)',
  },
  'minWidth': '0',
})

export const titleSeparator = css({
  display: 'inline',
  verticalAlign: '-0.125em',
})
