import {createVar, style} from '@vanilla-extract/css'

export const inlineBox = style({
  selectors: {
    // `&&` beats ui5 Box's own `&:not([hidden]) {display: block}` (0,2,0) from the `display` prop
    '&&:not([data-hidden])': {
      display: 'inline',
    },
  },
})

/** `hues[hasReferencedValue ? COMMENTS_HIGHLIGHT_HUE_KEY : 'gray'][dark ? 700 : 300].hex` */
export const blockQuoteBorderColorVar = createVar()

export const blockQuoteStack = style({
  borderLeft: `2px solid ${blockQuoteBorderColorVar}`,
  wordBreak: 'break-word',
})
