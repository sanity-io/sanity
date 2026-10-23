import {css} from '#styled-system/css'

export const overlayContainer = css({
  position: 'relative',
})

export const flexContainer = css({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
})

// `data-activate-on-focus` is rendered by the element with the `flexContainer` class
export const contentContainer = css({
  'zIndex': 13,
  'opacity': 0,
  'transition': 'opacity 300ms linear',
  '[data-activate-on-focus]:hover &, [data-activate-on-focus]:focus &': {
    opacity: 1,
  },
})

export const cardContainer = css({
  'position': 'absolute',
  'top': 0,
  'left': 0,
  'width': '100%',
  'height': '100%',
  'zIndex': 12,
  'transition': 'opacity 150ms ease-in-out',
  'opacity': 0,
  // Card sets border (border prop) and Box sets box-sizing (sizing prop) on itself
  '&&': {
    border: '1px solid var(--card-border-color)',
    boxSizing: 'border-box',
  },
  '[data-activate-on-focus]:hover &, [data-activate-on-focus]:focus &': {
    opacity: 0.9,
  },
})
