import {globalStyle, style} from '@vanilla-extract/css'

export const rootBox = style({
  position: 'relative',
})

export const mediaFlex = style({
  position: 'absolute',
  left: 0,
  top: 0,
  right: 0,
  bottom: 0,
})

export const mediaSkeleton = style({
  selectors: {
    // Skeleton sets its own dimensions
    '&&': {
      width: '100%',
      height: '100%',
    },
  },
})

export const progressFlex = style({
  'position': 'absolute',
  'left': 0,
  'top': 0,
  'right': 0,
  'bottom': 0,

  '::before': {
    backgroundColor: 'var(--card-bg-color)',
    opacity: 0.75,
    content: '""',
    display: 'block',
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  },
})

globalStyle(`${progressFlex} > svg`, {
  position: 'relative',
  zIndex: 2,
})

export const tooltipContentStack = style({
  maxWidth: `${200 / 16}rem`,
})
