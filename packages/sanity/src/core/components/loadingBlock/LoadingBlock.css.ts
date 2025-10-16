import {style, keyframes, styleVariants} from '@vanilla-extract/css'

const DEBUG_MODE = false
const SPINNER_DELAY = 750 // ms
const TEXT_DELAY = 2000 // ms

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

const baseCardStyle = style({
  alignItems: 'center',
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
})

const debugStyles = DEBUG_MODE
  ? style({
      background: 'linear-gradient(#5555ca, #daf9f9)',
      border: '2px solid black',
    })
  : ''

export const cardStyles = styleVariants({
  fill: [
    baseCardStyle,
    debugStyles,
    style({
      bottom: 0,
      height: '100%',
      left: 0,
      position: 'absolute',
      right: 0,
      top: 0,
      width: '100%',
    }),
  ],
  default: [
    baseCardStyle,
    debugStyles,
    style({
      'minHeight': '75px',
      'height': 'stretch',
      'width': 'stretch',
      // @ts-expect-error - webkit-fill-available is not in the type
      '@supports': {
        '(height: -webkit-fill-available)': {
          height: '-webkit-fill-available',
        },
        '(width: -webkit-fill-available)': {
          width: '-webkit-fill-available',
        },
      },
    }),
  ],
})

export const spinnerStyles = styleVariants({
  withPosition: style({
    position: 'absolute',
    animation: `500ms ease-out ${SPINNER_DELAY}ms 1 normal both running ${fadeIn}, 750ms ease-out ${TEXT_DELAY}ms 1 normal both running ${slideUp}`,
  }),
  default: style({
    position: 'absolute',
    animation: `500ms ease-out ${SPINNER_DELAY}ms 1 normal both running ${fadeIn}`,
  }),
})

export const textStyle = style({
  position: 'absolute',
  animation: `1500ms ease-out ${TEXT_DELAY}ms 1 normal both running ${fadeIn}, 750ms ease-out ${TEXT_DELAY}ms 1 normal both running ${slideDown}`,
})
