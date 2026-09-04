import {style} from '@vanilla-extract/css'

export const overlayContainer = style({
  position: 'relative',
})

export const flexContainer = style({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
})

export const contentContainer = style({
  zIndex: 13,
  opacity: 0,
  transition: 'opacity 300ms linear',
  selectors: {
    [`${flexContainer}:hover &, ${flexContainer}:focus &`]: {
      opacity: 1,
    },
  },
})

export const cardContainer = style({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  zIndex: 12,
  transition: 'opacity 150ms ease-in-out',
  opacity: 0,
  selectors: {
    // Card sets border (border prop) and Box sets box-sizing (sizing prop) on itself
    '&&': {
      border: '1px solid var(--card-border-color)',
      boxSizing: 'border-box',
    },
    [`${flexContainer}:hover &, ${flexContainer}:focus &`]: {
      opacity: 0.9,
    },
  },
})
