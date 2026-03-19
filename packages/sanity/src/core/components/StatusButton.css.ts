import {globalStyle, style} from '@vanilla-extract/css'

export const styledButton = style({
  selectors: {
    '&&': {
      position: 'relative',
    },
  },
})

/* The children in button is rendered inside a span, we need to absolutely position it. */
globalStyle(`${styledButton} > span:nth-child(2)`, {
  position: 'absolute',
  top: '6px',
  right: '6px',
  padding: '0',
})

export const dot = style({
  width: '4px',
  height: '4px',
  borderRadius: '3px',
  boxShadow: '0 0 0 1px var(--card-bg-color)',
})
