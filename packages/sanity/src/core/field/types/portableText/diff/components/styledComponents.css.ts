import {globalStyle, style} from '@vanilla-extract/css'

export const inlineBox = style({
  selectors: {
    '&&:not([hidden])': {
      display: 'inline',
      alignItems: 'center',
    },
    '&&[data-changed]': {
      cursor: 'pointer',
    },
  },
})

export const inlineText = style({
  selectors: {
    '&&:not([hidden])': {
      display: 'inline',
      color: 'inherit',
    },
  },
})

export const previewContainer = style({
  selectors: {
    '&&:not([hidden])': {
      display: 'inline-flex',
      alignItems: 'center',
    },
  },
})

// Target [data-ui="Text"] inside InlineBox when it's a child of PreviewContainer
globalStyle(`.${previewContainer}:not([hidden]) .${inlineBox} [data-ui="Text"]`, {
  opacity: 0.5,
})

export const popoverContainer = style({
  selectors: {
    '&&': {
      minWidth: '160px',
      maxHeight: '40vh',
      overflowY: 'auto',
    },
  },
})
