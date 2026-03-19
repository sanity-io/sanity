import {globalStyle, style, keyframes} from '@vanilla-extract/css'

// Enable to force debug background
const DEBUG_MODE = false

// Duration to wait before initial spinner appears
const SPINNER_DELAY = 750 // ms

// Duration to wait before text appears (if enabled)
const TEXT_DELAY = 2000 // ms

const fadeIn = keyframes({
  from: { opacity: 0 },
  to: { opacity: 1 },
})

const slideUp = keyframes({
  from: { transform: 'translateY(0)' },
  to: { transform: 'translateY(-15px)' },
})

const slideDown = keyframes({
  from: { transform: 'translateY(0)' },
  to: { transform: 'translateY(15px)' },
})

const baseCard = style({
  alignItems: 'center',
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
})

export const styledCardFill = style([baseCard, {
  selectors: {
    '&&': {
      bottom: 0,
      height: '100%',
      left: 0,
      position: 'absolute',
      right: 0,
      top: 0,
      width: '100%',
    },
  },
}])

export const styledCardDefault = style([baseCard, {
  selectors: {
    '&&': {
      minHeight: '75px',
      height: 'stretch',
      width: 'stretch',
    },
  },
}])

globalStyle(`${baseCard} > *`, {
  position: 'absolute',
})

export const styledSpinnerAnimated = style({
  selectors: {
    '&&': {
      animation: `500ms ease-out ${SPINNER_DELAY}ms 1 normal both running ${fadeIn}, 750ms ease-out ${TEXT_DELAY}ms 1 normal both running ${slideUp}`,
    },
  },
})

export const styledSpinnerStatic = style({
  selectors: {
    '&&': {
      animation: `500ms ease-out ${SPINNER_DELAY}ms 1 normal both running ${fadeIn}`,
    },
  },
})

export const styledText = style({
  selectors: {
    '&&': {
      animation: `1500ms ease-out ${TEXT_DELAY}ms 1 normal both running ${fadeIn}, 750ms ease-out ${TEXT_DELAY}ms 1 normal both running ${slideDown}`,
    },
  },
})
