import {globalStyle, style} from '@vanilla-extract/css'

export const inlineBox = style({
  selectors: {
    '&&:not([hidden])': {
      display: 'inline',
      alignItems: 'center',
    },
    '&:not([hidden])[data-changed]': {
      cursor: 'pointer',
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

globalStyle(`${previewContainer}:not([hidden]) ${inlineBox} [data-ui="Text"]`, {
  opacity: 0.5,
})

globalStyle(`${previewContainer}:not([hidden]) ${inlineBox} [data-ui="Icon"]`, {
  opacity: 0.5,
})

export const popoverContainer = style({
  maxHeight: '40vh',
  overflowY: 'auto',
  selectors: {
    '&&': {
      minWidth: '160px',
    },
  },
})
