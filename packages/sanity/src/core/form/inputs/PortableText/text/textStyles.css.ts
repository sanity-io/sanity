import {createVar, style} from '@vanilla-extract/css'

export const textContainer = style({
  display: 'block',
})

export const blockQuotePaddingVar = createVar()

export const blockQuoteRoot = style({
  position: 'relative',
  display: 'block',
  margin: '0',
  paddingLeft: blockQuotePaddingVar,
  selectors: {
    '&::before': {
      content: "''",
      position: 'absolute',
      left: 0,
      top: '-4px',
      bottom: '-4px',
      width: '3px',
      background: 'var(--card-border-color)',
    },
  },
})
