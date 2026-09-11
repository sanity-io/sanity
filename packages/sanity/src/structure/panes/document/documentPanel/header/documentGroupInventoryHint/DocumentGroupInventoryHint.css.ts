import {globalStyle, style} from '@vanilla-extract/css'

export const textButton = style({
  display: 'inline-block',
  verticalAlign: 'middle',
  appearance: 'none',
  border: 0,
  margin: 0,
  padding: 0,
  outline: 'none',
  all: 'unset',
  flex: 'none',
  whiteSpace: 'nowrap',
  color: 'var(--card-badge-suggest-fg-color)',
  cursor: 'pointer',
})

// `&&`: the descendant `Text` sets `color: var(--card-fg-color)` on itself with (0,1,0);
// the original rule won on styled-components injection order, so double the class to win by
// specificity regardless of stylesheet order.
globalStyle(`${textButton}${textButton} *`, {
  color: 'inherit',
})

globalStyle(`${textButton} svg[data-sanity-icon]`, {
  color: 'currentColor',
})
