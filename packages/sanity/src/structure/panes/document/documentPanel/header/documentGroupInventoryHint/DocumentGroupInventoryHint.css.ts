import {globalStyle, style} from '@vanilla-extract/css'

export const textButton = style({
  all: 'unset',
  display: 'inline-block',
  verticalAlign: 'middle',
  appearance: 'none',
  border: 0,
  margin: 0,
  padding: 0,
  outline: 'none',
  flex: 'none',
  whiteSpace: 'nowrap',
  color: 'var(--card-badge-suggest-fg-color)',
  cursor: 'pointer',
})

globalStyle(`${textButton}${textButton} *`, {
  color: 'inherit',
})

globalStyle(`${textButton} svg[data-sanity-icon]`, {
  color: 'currentColor',
})
