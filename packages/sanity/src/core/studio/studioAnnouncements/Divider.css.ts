import {createVar, style} from '@vanilla-extract/css'

export const hrOpacityVar = createVar()

export const hr = style({
  height: '1px',
  background: 'var(--card-border-color)',
  width: '100%',
  opacity: hrOpacityVar,
  transition: 'opacity 0.3s ease',
  margin: 0,
  border: 'none',
})
