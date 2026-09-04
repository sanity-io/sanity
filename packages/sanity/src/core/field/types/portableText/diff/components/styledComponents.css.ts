import {globalStyle, style} from '@vanilla-extract/css'

export const inlineBox = style({
  selectors: {
    // `&&`: ui5 Box's own display utility (`.sui-display-block:not([hidden])`) is (0,2,0).
    '&&:not([hidden])': {
      display: 'inline',
      alignItems: 'center',
    },
    '&:not([hidden])[data-changed]': {
      cursor: 'pointer',
    },
  },
})

export const inlineText = style({
  selectors: {
    // `&&`: Text's own `&:not([hidden]) {display: block}` is (0,2,0); the same block also beats
    // Text's plain (0,1,0) `color` rule.
    '&&:not([hidden])': {
      display: 'inline',
      color: 'inherit',
    },
  },
})

export const previewContainer = style({
  selectors: {
    // `&&`: ui5 Box's own display utility (`.sui-display-block:not([hidden])`) is (0,2,0).
    '&&:not([hidden])': {
      display: 'inline-flex',
      alignItems: 'center',
    },
  },
})

globalStyle(`${previewContainer}:not([hidden]) ${inlineBox} [data-ui="Text"]`, {
  opacity: 0.5,
})

export const popoverContainer = style({
  maxHeight: '40vh',
  overflowY: 'auto',
  selectors: {
    // `&&`: ui5 Box sets `min-width` on itself by default (`.sui-min-width`, (0,1,0)).
    '&&': {
      minWidth: '160px',
    },
  },
})
