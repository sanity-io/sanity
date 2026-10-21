import {globalStyle, style} from '@vanilla-extract/css'

import {inlineBox} from './styledComponents.css'

export const inlineObjectWrapper = style({
  selectors: {
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

globalStyle(`${inlineObjectWrapper}${inlineObjectWrapper}:not([hidden]) ${inlineBox}`, {
  display: 'inline-flex',
})
