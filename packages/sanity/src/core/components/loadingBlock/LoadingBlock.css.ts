import {css, keyframes} from '#styled-system/css'

// Duration to wait before initial spinner appears
const SPINNER_DELAY = 750 // ms

// Duration to wait before text appears (if enabled)
const TEXT_DELAY = 2000 // ms

const fadeIn = keyframes({
  from: {opacity: 0},
  to: {opacity: 1},
})

// The root is a plain `div`, or a `Layer` when `fill` is set: `Layer`'s own static rule sets
// `position: relative` (0,1,0), which `cardFill` overrides, so the root classes are doubled.
// The spinner and the label stack in flow, so the gap keeps them apart in every frame.
export const card = css({
  '&&': {
    alignItems: 'center',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-3)',
    justifyContent: 'center',
  },
})

export const cardFill = css({
  '&&': {
    bottom: 0,
    height: '100%',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    width: '100%',
  },
})

// `-webkit-fill-available` wins where the browser supports it, `stretch` is the fallback: the
// same outcome as the styled-components original, which declared `stretch` first and
// `-webkit-fill-available` second. A style object cannot repeat a property, so the override goes
// through `@supports` instead.
export const cardFlow = css({
  '&&': {
    'minHeight': '75px',
    'height': 'stretch',
    'width': 'stretch',
    '@supports (height: -webkit-fill-available)': {
      height: '-webkit-fill-available',
    },
    '@supports (width: -webkit-fill-available)': {
      width: '-webkit-fill-available',
    },
  },
})

export const cardDebug = css({
  '&&': {
    background: 'linear-gradient(#5555ca, #daf9f9)',
    border: '2px solid black',
  },
  '&& > *': {
    mixBlendMode: 'multiply',
  },
})

// On a plain `span` around the spinner, so it needs no `&&`: nothing else styles the wrapper
export const spinner = css({
  animation: `500ms ease-out ${SPINNER_DELAY}ms 1 normal both running ${fadeIn}`,
})

export const text = css({
  animation: `1500ms ease-out ${TEXT_DELAY}ms 1 normal both running ${fadeIn}`,
})
