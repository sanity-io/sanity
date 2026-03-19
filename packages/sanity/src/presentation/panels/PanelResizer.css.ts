import {globalStyle, style} from '@vanilla-extract/css'

export const resizer = style({
  position: 'relative',
})

export const resizerInner = style({
  position: 'absolute',
  top: 0,
  bottom: 0,
  left: '-5px',
  width: '9px',
  zIndex: 10,
  cursor: 'ew-resize',
})

export const resizerInnerDisabled = style({
  position: 'absolute',
  top: 0,
  bottom: 0,
  left: '-5px',
  width: '9px',
  zIndex: 10,
  cursor: 'auto',
})

// Border line
globalStyle(`${resizerInner} > span:nth-child(1), ${resizerInnerDisabled} > span:nth-child(1)`, {
  display: 'block',
  borderLeft: '1px solid var(--card-border-color)',
  position: 'absolute',
  top: 0,
  left: '4px',
  bottom: 0,
  transition: 'opacity 200ms',
})

// Hover effect (only for enabled)
globalStyle(`${resizerInner} > span:nth-child(2)`, {
  display: 'block',
  position: 'absolute',
  top: 0,
  left: 0,
  width: '9px',
  bottom: 0,
  backgroundColor: 'var(--card-border-color)',
  opacity: 0,
  transition: 'opacity 150ms',
})

globalStyle(`${resizerInner}:hover > span:nth-child(2)`, {
  opacity: 0.2,
})
