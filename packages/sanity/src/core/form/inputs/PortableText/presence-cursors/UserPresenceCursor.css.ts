import {createVar, globalStyle, style} from '@vanilla-extract/css'

const DOT_SIZE = 6

export const cursorBgVar = createVar()
export const cursorFgVar = createVar()
export const userBoxRadiusVar = createVar()

export const cursorLine = style({
  vars: {
    '--presence-cursor-bg': cursorBgVar,
    '--presence-cursor-fg': cursorFgVar,
  },
  borderLeft: '1px solid transparent',
  borderColor: 'var(--presence-cursor-bg)',
  marginLeft: '-1px',
  position: 'relative',
  wordBreak: 'normal',
  whiteSpace: 'normal',
  mixBlendMode: 'unset',
  pointerEvents: 'none',
})

export const cursorDot = style({
  backgroundColor: 'var(--presence-cursor-bg)',
  borderRadius: '50%',
  width: `${DOT_SIZE}px`,
  height: `${DOT_SIZE}px`,
  position: 'absolute',
  top: `-${DOT_SIZE - 1}px`,
  left: '-0.5px',
  transform: 'translateX(-50%)',
  mixBlendMode: 'unset',
  zIndex: 0,
  pointerEvents: 'all',
})

// Increase the hit area of the cursor dot
globalStyle(`${cursorDot}::before`, {
  content: "''",
  position: 'absolute',
  top: `-${DOT_SIZE / 2}px`,
  left: '50%',
  transform: 'translateX(-50%)',
  width: `${DOT_SIZE * 2}px`,
  height: `${DOT_SIZE * 3}px`,
  opacity: 0.5,
})

export const userBox = style({
  position: 'absolute',
  top: `-${DOT_SIZE * 1.5}px`,
  left: `-${DOT_SIZE * 0.75}px`,
  transformOrigin: 'left',
  whiteSpace: 'nowrap',
  padding: '3px 6px',
  boxSizing: 'border-box',
  borderRadius: userBoxRadiusVar,
  backgroundColor: 'var(--presence-cursor-bg)',
  zIndex: 1,
  mixBlendMode: 'unset',
  userSelect: 'none',
})

export const userText = style({
  color: 'var(--presence-cursor-fg)',
  mixBlendMode: 'unset',
})
