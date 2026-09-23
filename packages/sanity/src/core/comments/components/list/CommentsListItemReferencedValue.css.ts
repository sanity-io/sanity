import {createVar, style} from '@vanilla-extract/css'

export const inlineBox = style({
  selectors: {
    // `&&` beats ui5 Box's default `display="block"` (`.sui-display-block:not([hidden])`, (0,2,0))
    '&&:not([data-hidden])': {
      display: 'inline',
    },
  },
})

/** `hues[hue][dark ? 700 : 300].hex` */
export const blockQuoteBorderColorVar = createVar()

export const blockQuoteStack = style({
  borderLeft: `2px solid ${blockQuoteBorderColorVar}`,
  wordBreak: 'break-word',
})
