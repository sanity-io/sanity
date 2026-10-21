import {style} from '@vanilla-extract/css'

export const root = style({
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  selectors: {
    '&&': {
      position: 'fixed',
    },
  },
})

export const backdrop = style({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  selectors: {
    '&&': {
      background: 'var(--card-shadow-penumbra-color)',
    },
  },
})

export const innerCard = style({
  position: 'relative',
  pointerEvents: 'all',
  flexDirection: 'column',
  minWidth: '200px',
  maxWidth: '280px',
  overflow: 'auto',
  selectors: {
    '&&': {
      height: '100%',
    },
  },
})
