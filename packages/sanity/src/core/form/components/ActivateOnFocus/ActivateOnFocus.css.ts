import {globalStyle, style} from '@vanilla-extract/css'

export const overlayContainer = style({
  position: 'relative',
})

export const contentContainer = style({
  zIndex: 13,
  opacity: 0,
  transition: 'opacity 300ms linear',
})

export const cardContainer = style({
  selectors: {
    '&&': {
      border: '1px solid var(--card-border-color)',
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: 12,
      transition: 'opacity 150ms ease-in-out',
      opacity: 0,
      boxSizing: 'border-box',
    },
  },
})

export const flexContainer = style({
  selectors: {
    '&&': {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
    },
  },
})

globalStyle(`${flexContainer}:hover ${cardContainer}, ${flexContainer}:focus ${cardContainer}`, {
  opacity: 0.9,
})

globalStyle(`${flexContainer}:hover ${contentContainer}, ${flexContainer}:focus ${contentContainer}`, {
  opacity: 1,
})
