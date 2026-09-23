import {globalStyle, style} from '@vanilla-extract/css'

import {inlineBox} from './styledComponents.css'

export const inlineObjectWrapper = style({
  selectors: {
    // `&&`: Card's own `&:not([hidden]) {display: block}` is (0,2,0).
    '&&:not([hidden])': {
      display: 'inline',
      cursor: 'pointer',
      whiteSpace: 'nowrap',
      alignItems: 'center',
    },
    '&:not([hidden])[data-removed]': {
      textDecoration: 'line-through',
    },
  },
})

// `inlineBox` sets its own display from `&&:not([hidden])` (0,3,0); doubling the wrapper class keeps
// this descendant override above it regardless of stylesheet order.
globalStyle(`${inlineObjectWrapper}${inlineObjectWrapper}:not([hidden]) ${inlineBox}`, {
  display: 'inline-flex',
})
