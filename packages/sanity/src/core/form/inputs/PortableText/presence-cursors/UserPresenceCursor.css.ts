import {css} from '#styled-system/css'

const DOT_SIZE = 6

/** The user's colour: `tints[isDark ? 400 : 500].hex`. Set on the cursor line, read by its descendants. */
export const presenceCursorBgVar = '--user-presence-cursor-bg'
/** The name label colour: `tints[isDark ? 900 : 50].hex` */
export const presenceCursorFgVar = '--user-presence-cursor-fg'
/** `radius[4]` */
export const radius4Var = '--user-presence-cursor-radius-4'

export const cursorLine = css({
  borderLeft: '1px solid transparent',
  borderColor: `var(${presenceCursorBgVar})`,
  marginLeft: '-1px',
  position: 'relative',
  wordBreak: 'normal',
  whiteSpace: 'normal',
  mixBlendMode: 'unset',
  pointerEvents: 'none',
})

export const cursorDot = css({
  'backgroundColor': `var(${presenceCursorBgVar})`,
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
  '&::before': {
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

export const userBox = css({
  position: 'absolute',
  top: `-${DOT_SIZE * 1.5}px`,
  left: `-${DOT_SIZE * 0.75}px`,
  transformOrigin: 'left',
  whiteSpace: 'nowrap',
  padding: '3px 6px',
  boxSizing: 'border-box',
  borderRadius: `var(${radius4Var})`,
  backgroundColor: `var(${presenceCursorBgVar})`,
  zIndex: 1,
  mixBlendMode: 'unset',
  userSelect: 'none',
})

export const userText = css({
  'mixBlendMode': 'unset',
  // `Text` sets `color: var(--card-fg-color)` on the same element
  '&&': {
    color: `var(${presenceCursorFgVar})`,
  },
})
