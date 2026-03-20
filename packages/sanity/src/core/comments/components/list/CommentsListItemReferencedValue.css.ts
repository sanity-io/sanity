import {createVar, style} from '@vanilla-extract/css'

export const borderColorVar = createVar()

export const inlineBox = style({
  selectors: {
    '&&:not([data-hidden])': {
      display: 'inline',
    },
  },
})

export const blockQuoteStack = style({
  selectors: {
    '&&': {
      borderLeft: `2px solid ${borderColorVar}`,
      wordBreak: 'break-word',
    },
  },
})
