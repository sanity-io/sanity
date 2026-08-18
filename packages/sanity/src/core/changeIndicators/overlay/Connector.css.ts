import {style} from '@vanilla-extract/css'

export const debugRect = style({
  stroke: '#ccc',
  fill: 'none',
  pointerEvents: 'none',
  strokeLinecap: 'round',
})

export const connectorPath = style({
  fill: 'none',
  pointerEvents: 'none',
  strokeLinejoin: 'round',
  stroke: 'var(--card-badge-caution-dot-color)',
})

export const interactivePath = style({
  fill: 'none',
  pointerEvents: 'stroke',
  stroke: 'transparent',
  cursor: 'pointer',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  opacity: 0,
  selectors: {
    '&:hover': {
      opacity: 0.2,
    },
  },
})

export const rightBarWrapper = style({
  stroke: 'none',
  pointerEvents: 'none',
  fill: 'var(--card-badge-caution-dot-color)',
})
