import {createVar, style} from '@vanilla-extract/css'

export const inlineBox = style({
  selectors: {
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
