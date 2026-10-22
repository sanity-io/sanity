import {css} from '#styled-system/css'

export const inlineBox = css({
  // `&&` beats ui5 Box's own `&:not([hidden]) {display: block}` (0,2,0) from the `display` prop
  '&&:not([data-hidden])': {
    display: 'inline',
  },
})

/** `hues[hasReferencedValue ? COMMENTS_HIGHLIGHT_HUE_KEY : 'gray'][dark ? 700 : 300].hex` */
export const blockQuoteBorderColorVar =
  '--comments-list-item-referenced-value-block-quote-border-color'

export const blockQuoteStack = css({
  borderLeft: `2px solid var(${blockQuoteBorderColorVar})`,
  wordBreak: 'break-word',
})
