import {style} from '@vanilla-extract/css'

import {
  POPOVER_INPUT_PADDING,
  POPOVER_MAX_HEIGHT,
  POPOVER_MAX_WIDTH,
} from '../constants'

const Y_POSITION = 12 // vh

export const motionOverlay = style({
  backgroundColor: 'var(--card-backdrop-color)',
  bottom: 0,
  left: 0,
  position: 'absolute',
  right: 0,
  top: 0,
})

export const searchMotionCard = style({
  display: 'flex',
  flexDirection: 'column',
  left: '50%',
  maxHeight: `min(calc(100vh - ${Y_POSITION}vh - ${POPOVER_INPUT_PADDING}px), ${POPOVER_MAX_HEIGHT}px)`,
  position: 'absolute',
  top: `${Y_POSITION}vh`,
  width: `min(calc(100vw - ${POPOVER_INPUT_PADDING * 2}px), ${POPOVER_MAX_WIDTH}px)`,
})
