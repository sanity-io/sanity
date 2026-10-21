import {createVar, style} from '@vanilla-extract/css'

const Y_POSITION = 12 // vh

export const popoverInputPaddingVar = createVar()
export const popoverMaxHeightVar = createVar()
export const popoverMaxWidthVar = createVar()

export const motionOverlay = style({
  bottom: 0,
  left: 0,
  position: 'absolute',
  right: 0,
  top: 0,
  selectors: {
    '&&': {
      backgroundColor: 'var(--card-backdrop-color)',
    },
  },
})

export const searchMotionCard = style({
  flexDirection: 'column',
  left: '50%',
  maxHeight: `min(calc(100vh - ${Y_POSITION}vh - ${popoverInputPaddingVar}), ${popoverMaxHeightVar})`,
  position: 'absolute',
  top: `${Y_POSITION}vh`,
  width: `min(calc(100vw - ${popoverInputPaddingVar} * 2), ${popoverMaxWidthVar})`,
  selectors: {
    '&&&': {
      display: 'flex',
    },
  },
})
