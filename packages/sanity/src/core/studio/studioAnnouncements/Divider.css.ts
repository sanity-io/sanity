import {style} from '@vanilla-extract/css'

export const dividerHr = style({
  height: '1px',
  background: 'var(--card-border-color)',
  width: '100%',
  opacity: 1,
  transition: 'opacity 0.3s ease',
  margin: 0,
  border: 'none',
})

export const dividerHrHidden = style({
  opacity: 0,
})
