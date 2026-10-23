import {css} from '#styled-system/css'

export const inlineBox = css({
  // `&&` beats ui5 Box's default `display="block"` (`.sui-display-block:not([hidden])`, (0,2,0))
  '&&:not([data-hidden])': {
    display: 'inline',
  },
})

/** `hues[hue][dark ? 700 : 300].hex` */
export const blockQuoteBorderColorVar =
  '--comments-list-item-referenced-value-block-quote-border-color'

export const blockQuoteStack = css({
  borderLeft: `2px solid var(${blockQuoteBorderColorVar})`,
  wordBreak: 'break-word',
})
