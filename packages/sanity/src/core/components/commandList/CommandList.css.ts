import {createVar, style} from '@vanilla-extract/css'

export const focusOverlayOffsetVar = createVar()

export const virtualListBox = style({
  selectors: {
    '&&': {
      height: '100%',
      outline: 'none',
      overflowX: 'hidden',
      overflowY: 'auto',
      overscrollBehavior: 'contain',
      width: '100%',
    },
  },
})

export const focusOverlayDiv = style({
  bottom: focusOverlayOffsetVar,
  left: focusOverlayOffsetVar,
  right: focusOverlayOffsetVar,
  top: focusOverlayOffsetVar,
  pointerEvents: 'none',
  position: 'absolute',
  zIndex: 2,
})

/*
 * Conditionally appears over command list items to cancel existing :hover states for all child elements.
 * It should only appear if hover capabilities are available (not on touch devices)
 */
export const pointerOverlayDiv = style({
  bottom: 0,
  display: 'none',
  left: 0,
  position: 'absolute',
  right: 0,
  top: 0,
  zIndex: 1,
  '@media': {
    '(hover: hover)': {
      selectors: {
        '&[data-enabled="true"]': {
          display: 'block',
        },
      },
    },
  },
})

export const virtualListChildBox = style({
  position: 'relative',
  width: '100%',
})
