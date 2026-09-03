import {globalStyle, style} from '@vanilla-extract/css'

import {previewContainer} from './styledComponents.css'

export const annotationWrapper = style({
  textDecoration: 'none',
  display: 'inline',
  position: 'relative',
  border: '0',
  padding: '0',
  borderBottom: '2px dotted currentColor',
  boxShadow: 'inset 0 0 0 1px var(--card-border-color)',
  whiteSpace: 'nowrap',
  alignItems: 'center',
  // Pre-existing declaration carried over verbatim: `color(<var> a(10%))` is not valid CSS color
  // syntax, so browsers drop it at computed-value time and no background renders.
  backgroundColor: 'color(var(--card-fg-color) a(10%))',

  selectors: {
    '&[data-changed]': {
      cursor: 'pointer',
    },
    '&[data-removed]': {
      textDecoration: 'line-through',
    },
  },
})

globalStyle(`${annotationWrapper}:hover ${previewContainer}`, {
  opacity: 1,
})
