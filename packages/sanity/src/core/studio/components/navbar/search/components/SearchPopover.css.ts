import {css} from '#styled-system/css'

const Y_POSITION = 12 // vh

export const popoverInputPaddingVar = '--search-popover-input-padding'
export const popoverMaxHeightVar = '--search-popover-max-height'
export const popoverMaxWidthVar = '--search-popover-max-width'

export const motionOverlay = css({
  'bottom': 0,
  'left': 0,
  'position': 'absolute',
  'right': 0,
  'top': 0,
  // Card sets background-color: var(--card-bg-color) itself
  '&&': {
    backgroundColor: 'var(--card-backdrop-color)',
  },
})

export const searchMotionCard = css({
  'flexDirection': 'column',
  'left': '50%',
  'maxHeight': `min(calc(100vh - ${Y_POSITION}vh - var(${popoverInputPaddingVar})), var(${popoverMaxHeightVar}))`,
  'position': 'absolute',
  'top': `${Y_POSITION}vh`,
  'width': `min(calc(100vw - var(${popoverInputPaddingVar}) * 2), var(${popoverMaxWidthVar}))`,
  // Card (via Box) sets display under `&:not([hidden])` (0,2,0); the original used !important
  '&&&': {
    display: 'flex',
  },
})
