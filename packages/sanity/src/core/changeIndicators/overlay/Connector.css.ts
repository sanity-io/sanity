import {css} from '#styled-system/css'

export const debugRect = css({
  stroke: '#ccc',
  fill: 'none',
  pointerEvents: 'none',
  strokeLinecap: 'round',
})

export const connectorPath = css({
  fill: 'none',
  pointerEvents: 'none',
  strokeLinejoin: 'round',
  stroke: 'var(--card-badge-caution-dot-color)',
})

export const interactivePath = css({
  'fill': 'none',
  'pointerEvents': 'stroke',
  'stroke': 'transparent',
  'cursor': 'pointer',
  'strokeLinecap': 'round',
  'strokeLinejoin': 'round',
  'opacity': 0,

  '&:hover': {
    opacity: 0.2,
  },
})

export const rightBarWrapper = css({
  stroke: 'none',
  pointerEvents: 'none',
  fill: 'var(--card-badge-caution-dot-color)',
})
