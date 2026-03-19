import {globalStyle, style} from '@vanilla-extract/css'
import {rem} from '@sanity/ui'

export const rootBox = style({
  selectors: {
    '&&': {
      position: 'relative',
    },
  },
})

export const mediaFlex = style({
  selectors: {
    '&&': {
      position: 'absolute',
      left: 0,
      top: 0,
      right: 0,
      bottom: 0,
    },
  },
})

export const mediaSkeleton = style({
  selectors: {
    '&&': {
      width: '100%',
      height: '100%',
    },
  },
})

export const progressFlex = style({
  selectors: {
    '&&': {
      position: 'absolute',
      left: 0,
      top: 0,
      right: 0,
      bottom: 0,
    },
  },
})

globalStyle(`${progressFlex}::before`, {
  backgroundColor: 'var(--card-bg-color)',
  opacity: 0.75,
  content: "''",
  display: 'block',
  position: 'absolute',
  left: 0,
  top: 0,
  right: 0,
  bottom: 0,
})

globalStyle(`${progressFlex} > svg`, {
  position: 'relative',
  zIndex: 2,
})

export const tooltipContentStack = style({
  selectors: {
    '&&': {
      maxWidth: rem(200),
    },
  },
})
