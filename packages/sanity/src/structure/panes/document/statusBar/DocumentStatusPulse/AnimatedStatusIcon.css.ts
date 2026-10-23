import {css, keyframes} from '#styled-system/css'

const rotate = keyframes({
  '0%': {transform: 'rotate(0)'},
  '100%': {transform: 'rotate(360deg)'},
})

const bounce = keyframes({
  '0%': {scale: '1'},
  '12.5%': {scale: '0.8'},
  '25%': {scale: '1.2'},
  '37.5%': {scale: '0.9'},
  '50%': {scale: '1.1'},
  '62.5%': {scale: '0.95'},
  '75%': {scale: '1.05'},
  '87.5%': {scale: '0.99'},
  '100%': {scale: '1'},
})

// The icon renders `data-status` and, once the status has changed after mount, `data-animate`.
// The transitions are declared on the state they lead into, so each state has its own timing.

export const root = css({
  'transformBox': 'fill-box',
  'transformOrigin': 'center',
  '@media (prefers-reduced-motion: no-preference)': {
    '[data-sanity-icon="animated-status-icon"][data-status="saved"][data-animate] &': {
      animation: `${bounce} 0.5s ease-out 0.2s`,
    },
  },
})

export const rotateGroup = css({
  'transformOrigin': 'center',
  '&[data-rotate]': {
    animation: `${rotate} 1s ease-in-out infinite`,
  },
})

export const arrows = css({
  'transformOrigin': 'center',
  '[data-sanity-icon="animated-status-icon"][data-status="syncing"] &': {opacity: 1},
  '[data-sanity-icon="animated-status-icon"][data-status="saved"] &': {opacity: 0},
  '[data-sanity-icon="animated-status-icon"][data-status="changes"] &': {opacity: 0},
  '@media (prefers-reduced-motion: no-preference)': {
    '[data-sanity-icon="animated-status-icon"][data-status="saved"] &': {
      transition: 'opacity 0.2s ease-out',
    },
    '[data-sanity-icon="animated-status-icon"][data-status="changes"] &': {
      transition: 'opacity 0.3s cubic-bezier(0.25, 0.1, 0.35, 1)',
    },
  },
})

export const circle = css({
  '[data-sanity-icon="animated-status-icon"][data-status="syncing"] &': {
    strokeDasharray: '0 0 23 3 23 3',
    strokeDashoffset: '10',
    opacity: 1,
  },
  '[data-sanity-icon="animated-status-icon"][data-status="saved"] &': {
    strokeDasharray: '0 0 23 0 23 0',
    strokeDashoffset: '10',
    opacity: 1,
  },
  '[data-sanity-icon="animated-status-icon"][data-status="changes"] &': {
    strokeDasharray: '0 60 23 0 23 0',
    strokeDashoffset: '0',
    opacity: 0,
  },
  '@media (prefers-reduced-motion: no-preference)': {
    '[data-sanity-icon="animated-status-icon"][data-status="saved"] &': {
      transition:
        'stroke-dasharray 0.2s ease-out, stroke-dashoffset 0.2s ease-out, opacity 0.2s ease-out',
    },
    '[data-sanity-icon="animated-status-icon"][data-status="changes"] &': {
      transition:
        'stroke-dasharray 0.5s ease-out, stroke-dashoffset 0.5s ease-out, opacity 0.5s ease-out',
    },
  },
})

// Drawn with `pathLength="1"`: a dash offset of 1 hides the path, 0 draws it in full
export const checkmark = css({
  'strokeDasharray': '1 1',
  '[data-sanity-icon="animated-status-icon"][data-status="syncing"] &': {strokeDashoffset: '1'},
  '[data-sanity-icon="animated-status-icon"][data-status="saved"] &': {strokeDashoffset: '0'},
  '[data-sanity-icon="animated-status-icon"][data-status="changes"] &': {strokeDashoffset: '1'},
  '@media (prefers-reduced-motion: no-preference)': {
    '[data-sanity-icon="animated-status-icon"][data-status="saved"] &': {
      transition: 'stroke-dashoffset 0.3s ease-out 0.4s',
    },
    '[data-sanity-icon="animated-status-icon"][data-status="changes"] &': {
      transition: 'stroke-dashoffset 0.2s ease-out',
    },
  },
})
