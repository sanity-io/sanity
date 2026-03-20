import {style} from '@vanilla-extract/css'

export const root = style({
  selectors: {
    '&&': {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
    },
  },
})

export const backdropMotion = style({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'var(--card-shadow-penumbra-color)',
})

export const innerCardMotion = style({
  position: 'relative',
  pointerEvents: 'all',
  flexDirection: 'column',
  height: '100%',
  minWidth: '200px',
  maxWidth: '280px',
  overflow: 'auto',
})
