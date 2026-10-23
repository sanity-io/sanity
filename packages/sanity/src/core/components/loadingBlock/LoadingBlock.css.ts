import {css, firstThatWorks, keyframes} from '#styled-system/css'

// Duration to wait before initial spinner appears
const SPINNER_DELAY = 750 // ms

// Duration to wait before text appears (if enabled)
const TEXT_DELAY = 2000 // ms

export const root = css({
  'alignItems': 'center',
  'boxSizing': 'border-box',
  'display': 'flex',
  'flexDirection': 'column',
  'justifyContent': 'center',
  // The children are @sanity/ui Text roots, which set `position: relative` on themselves
  '&& > *': {
    position: 'absolute',
  },
})

export const fill = css({
  'bottom': 0,
  'height': '100%',
  'left': 0,
  'right': 0,
  'top': 0,
  'width': '100%',
  // Layer sets `position: relative` on itself
  '&&': {
    position: 'absolute',
  },
})

export const block = css({
  minHeight: '75px',
  height: firstThatWorks('-webkit-fill-available', 'stretch'),
  width: firstThatWorks('-webkit-fill-available', 'stretch'),
})

export const debug = css({
  'background': 'linear-gradient(#5555ca, #daf9f9)',
  'border': '2px solid black',
  '& > *': {
    mixBlendMode: 'multiply',
  },
})

const fadeIn = keyframes({
  from: {
    opacity: 0,
  },
  to: {
    opacity: 1,
  },
})

const slideUp = keyframes({
  from: {
    transform: 'translateY(0)',
  },
  to: {
    transform: 'translateY(-15px)',
  },
})

const slideDown = keyframes({
  from: {
    transform: 'translateY(0)',
  },
  to: {
    transform: 'translateY(15px)',
  },
})

export const spinner = {
  animatePosition: css({
    animation: `500ms ease-out ${SPINNER_DELAY}ms 1 normal both running ${fadeIn}, 750ms ease-out ${TEXT_DELAY}ms 1 normal both running ${slideUp}`,
  }),
  static: css({
    animation: `500ms ease-out ${SPINNER_DELAY}ms 1 normal both running ${fadeIn}`,
  }),
}

export const text = css({
  animation: `1500ms ease-out ${TEXT_DELAY}ms 1 normal both running ${fadeIn}, 750ms ease-out ${TEXT_DELAY}ms 1 normal both running ${slideDown}`,
})
