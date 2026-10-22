import {css} from '#styled-system/css'

export const virtualListBox = css({
  height: '100%',
  outline: 'none',
  overflowX: 'hidden',
  overflowY: 'auto',
  overscrollBehavior: 'contain',
  width: '100%',
})

export const virtualListChildBox = css({
  position: 'relative',
  width: '100%',
})

/** `-${offset}px`: how far the focus ring overlay extends past the list edges */
export const focusOverlayInsetVar = '--command-list-focus-overlay-inset'
/** `rem(radius[1])` */
export const focusOverlayRadiusVar = '--command-list-focus-overlay-radius'
/** `focusRingStyle(...)` box-shadow computed from the theme */
export const focusOverlayBoxShadowVar = '--command-list-focus-overlay-box-shadow'

/**
 * Conditionally render a focus ring overlay over the command list, with adjustable offset
 */
export const focusOverlay = css({
  'bottom': `var(${focusOverlayInsetVar})`,
  'borderRadius': `var(${focusOverlayRadiusVar})`,
  'left': `var(${focusOverlayInsetVar})`,
  'pointerEvents': 'none',
  'position': 'absolute',
  'right': `var(${focusOverlayInsetVar})`,
  'top': `var(${focusOverlayInsetVar})`,
  'zIndex': 2,
  // `data-command-list` is rendered by the element with the `virtualListBox` class
  '[data-command-list]:focus-visible &': {
    boxShadow: `var(${focusOverlayBoxShadowVar})`,
  },
})

/*
 * Conditionally appears over command list items to cancel existing :hover states for all child elements.
 * It should only appear if hover capabilities are available (not on touch devices)
 */
export const pointerOverlay = css({
  'bottom': 0,
  'display': 'none',
  'left': 0,
  'position': 'absolute',
  'right': 0,
  'top': 0,
  'zIndex': 1,
  '@media (hover: hover)': {
    "&[data-enabled='true']": {
      display: 'block',
    },
  },
})
