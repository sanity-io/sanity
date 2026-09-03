import {globalStyle, style, styleVariants} from '@vanilla-extract/css'

const base = style({
  position: 'absolute',
  top: 0,
  bottom: 0,
  width: '9px',
  zIndex: 201,
  cursor: 'ew-resize',
})

export const root = styleVariants({
  right: [base, {right: '-4px'}],
  left: [base, {left: '-4px'}],
})

// Border
globalStyle(`${base} > span:nth-child(1)`, {
  display: 'block',
  borderLeft: '1px solid var(--card-border-color)',
  position: 'absolute',
  top: 0,
  bottom: 0,
  transition: 'opacity 200ms',
})

globalStyle(`${root.right} > span:nth-child(1)`, {
  right: '4px',
})

globalStyle(`${root.left} > span:nth-child(1)`, {
  left: '4px',
})

// Hover effect
globalStyle(`${base} > span:nth-child(2)`, {
  display: 'block',
  position: 'absolute',
  top: 0,
  width: '9px',
  bottom: 0,
  backgroundColor: 'var(--card-border-color)',
  opacity: 0,
  transition: 'opacity 150ms',
})

globalStyle(`${root.right} > span:nth-child(2)`, {
  right: '0px',
})

globalStyle(`${root.left} > span:nth-child(2)`, {
  left: '0px',
})

globalStyle(`${base}:hover > span:nth-child(2)`, {
  '@media': {
    '(hover: hover)': {
      opacity: 0.2,
    },
  },
})
