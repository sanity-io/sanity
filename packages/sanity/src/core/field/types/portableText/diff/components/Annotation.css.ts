import {style} from '@vanilla-extract/css'

export const annotationWrapper = style({
  textDecoration: 'none',
  display: 'inline',
  position: 'relative',
  border: 0,
  padding: 0,
  borderBottom: '2px dotted currentColor',
  boxShadow: 'inset 0 0 0 1px var(--card-border-color)',
  whiteSpace: 'nowrap',
  alignItems: 'center',
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
