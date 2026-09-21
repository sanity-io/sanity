import {createGlobalVar, createVar, keyframes, style} from '@vanilla-extract/css'

/** `${space[4]}px` */
export const space4Var = createVar()
/** `${space[5]}px` */
export const space5Var = createVar()

// `@property` registrations (kept under their original global names)
const startMaskColor = createGlobalVar('start-mask-color', {
  syntax: '<color>',
  inherits: false,
  initialValue: '#000',
})

const endMaskColor = createGlobalVar('end-mask-color', {
  syntax: '<color>',
  inherits: false,
  initialValue: '#000',
})

const fadeMask = keyframes({
  '0%': {
    vars: {
      [startMaskColor]: '#000',
      [endMaskColor]: 'transparent',
    },
  },
  '2%, 98%': {
    vars: {
      [startMaskColor]: 'transparent',
      [endMaskColor]: 'transparent',
    },
  },
  '100%': {
    vars: {
      [startMaskColor]: 'transparent',
      [endMaskColor]: '#000',
    },
  },
})

export const body = style({
  vars: {
    '--mask-size': '3rem',
  },
  overflowX: 'clip',
  overflowY: 'auto',
  overscrollBehavior: 'contain',
  padding: `calc(${space5Var} * 0.5) calc(${space4Var})`,
  maskImage: `linear-gradient(
    to var(--direction, bottom),
    ${startMaskColor},
    #000 var(--mask-size),
    #000 calc(100% - var(--mask-size)),
    ${endMaskColor}
  )`,
  maskPosition: '0% 0%',
  maskRepeat: 'no-repeat',
  maskSize: '100% 100%',
  animation: fadeMask,
  animationTimeline: 'scroll(self y)',
})
