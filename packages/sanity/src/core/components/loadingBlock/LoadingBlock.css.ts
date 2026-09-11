import {globalStyle, keyframes, style, styleVariants} from '@vanilla-extract/css'

// Duration to wait before initial spinner appears
const SPINNER_DELAY = 750 // ms

// Duration to wait before text appears (if enabled)
const TEXT_DELAY = 2000 // ms

export const root = style({
  alignItems: 'center',
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
})

// The children are @sanity/ui Text roots, which set `position: relative` on themselves
globalStyle(`${root}${root} > *`, {
  position: 'absolute',
})

export const fill = style({
  bottom: 0,
  height: '100%',
  left: 0,
  right: 0,
  top: 0,
  width: '100%',
  selectors: {
    // Layer sets `position: relative` on itself
    '&&': {
      position: 'absolute',
    },
  },
})

export const block = style({
  minHeight: '75px',
  height: ['stretch', '-webkit-fill-available'],
  width: ['stretch', '-webkit-fill-available'],
})

export const debug = style({
  background: 'linear-gradient(#5555ca, #daf9f9)',
  border: '2px solid black',
})

globalStyle(`${debug} > *`, {
  mixBlendMode: 'multiply',
})

const fadeIn = keyframes({
  from: {opacity: 0},
  to: {opacity: 1},
})

const slideUp = keyframes({
  from: {transform: 'translateY(0)'},
  to: {transform: 'translateY(-15px)'},
})

const slideDown = keyframes({
  from: {transform: 'translateY(0)'},
  to: {transform: 'translateY(15px)'},
})

export const spinner = styleVariants({
  animatePosition: {
    animation: `500ms ease-out ${SPINNER_DELAY}ms 1 normal both running ${fadeIn}, 750ms ease-out ${TEXT_DELAY}ms 1 normal both running ${slideUp}`,
  },
  static: {
    animation: `500ms ease-out ${SPINNER_DELAY}ms 1 normal both running ${fadeIn}`,
  },
})

export const text = style({
  animation: `1500ms ease-out ${TEXT_DELAY}ms 1 normal both running ${fadeIn}, 750ms ease-out ${TEXT_DELAY}ms 1 normal both running ${slideDown}`,
})
