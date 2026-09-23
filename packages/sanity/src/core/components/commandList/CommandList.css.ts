import {createVar, style} from '@vanilla-extract/css'

export const virtualListBox = style({
  height: '100%',
  outline: 'none',
  overflowX: 'hidden',
  overflowY: 'auto',
  overscrollBehavior: 'contain',
  width: '100%',
})

export const virtualListChildBox = style({
  position: 'relative',
  width: '100%',
})

/** `-${offset}px`: how far the focus ring overlay extends past the list edges */
export const focusOverlayInsetVar = createVar()
/** `rem(radius[1])` */
export const focusOverlayRadiusVar = createVar()
/** `focusRingStyle(...)` box-shadow computed from the theme */
export const focusOverlayBoxShadowVar = createVar()

/**
 * Conditionally render a focus ring overlay over the command list, with adjustable offset
 */
export const focusOverlay = style({
  bottom: focusOverlayInsetVar,
  borderRadius: focusOverlayRadiusVar,
  left: focusOverlayInsetVar,
  pointerEvents: 'none',
  position: 'absolute',
  right: focusOverlayInsetVar,
  top: focusOverlayInsetVar,
  zIndex: 2,
  selectors: {
    [`${virtualListBox}:focus-visible &`]: {
      boxShadow: focusOverlayBoxShadowVar,
    },
  },
})

/*
 * Conditionally appears over command list items to cancel existing :hover states for all child elements.
 * It should only appear if hover capabilities are available (not on touch devices)
 */
export const pointerOverlay = style({
  'bottom': 0,
  'display': 'none',
  'left': 0,
  'position': 'absolute',
  'right': 0,
  'top': 0,
  'zIndex': 1,
  '@media': {
    '(hover: hover)': {
      selectors: {
        "&[data-enabled='true']": {
          display: 'block',
        },
      },
    },
  },
})
