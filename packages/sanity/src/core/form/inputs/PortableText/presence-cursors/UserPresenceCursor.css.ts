import {createVar, style} from '@vanilla-extract/css'

const DOT_SIZE = 6

/** The user's colour: `tints[isDark ? 400 : 500].hex`. Set on the cursor line, read by its descendants. */
export const presenceCursorBgVar = createVar()
/** The name label colour: `tints[isDark ? 900 : 50].hex` */
export const presenceCursorFgVar = createVar()
/** `radius[4]` */
export const radius4Var = createVar()

export const cursorLine = style({
  borderLeft: '1px solid transparent',
  borderColor: presenceCursorBgVar,
  marginLeft: '-1px',
  position: 'relative',
  wordBreak: 'normal',
  whiteSpace: 'normal',
  mixBlendMode: 'unset',
  pointerEvents: 'none',
})

export const cursorDot = style({
  'backgroundColor': presenceCursorBgVar,
  'borderRadius': '50%',
  'width': `${DOT_SIZE}px`,
  'height': `${DOT_SIZE}px`,
  'position': 'absolute',
  'top': `-${DOT_SIZE - 1}px`,
  'left': '-0.5px',
  'transform': 'translateX(-50%)',
  'mixBlendMode': 'unset',
  'zIndex': 0,
  'pointerEvents': 'all',

  // Increase the hit area of the cursor dot
  '::before': {
    content: '""',
    position: 'absolute',
    top: `-${DOT_SIZE / 2}px`,
    left: '50%',
    transform: 'translateX(-50%)',
    width: `${DOT_SIZE * 2}px`,
    height: `${DOT_SIZE * 3}px`,
    opacity: 0.5,
  },
})

export const userBox = style({
  position: 'absolute',
  top: `-${DOT_SIZE * 1.5}px`,
  left: `-${DOT_SIZE * 0.75}px`,
  transformOrigin: 'left',
  whiteSpace: 'nowrap',
  padding: '3px 6px',
  boxSizing: 'border-box',
  borderRadius: radius4Var,
  backgroundColor: presenceCursorBgVar,
  zIndex: 1,
  mixBlendMode: 'unset',
  userSelect: 'none',
})

export const userText = style({
  mixBlendMode: 'unset',
  selectors: {
    // `Text` sets `color: var(--card-fg-color)` on the same element
    '&&': {
      color: presenceCursorFgVar,
    },
  },
})
