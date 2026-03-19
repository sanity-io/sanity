import {style} from '@vanilla-extract/css'
import {inlineBox} from './styledComponents.css'

export const inlineObjectWrapper = style({
  selectors: {
    '&&:not([hidden])': {
      display: 'inline',
      cursor: 'pointer',
      whiteSpace: 'nowrap',
      alignItems: 'center',
    },
    '&&[data-removed]': {
      textDecoration: 'line-through',
    },
  },
})
