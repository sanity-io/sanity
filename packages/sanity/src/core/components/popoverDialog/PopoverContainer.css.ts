import {createVar, fallbackVar, style} from '@vanilla-extract/css'

/**
 * `rem(container[width[n]])` for each entry of the responsive `width` prop (`100%` for `'auto'`),
 * index 0 being the base value and index n applying from `media[n - 1]` upwards.
 */
export const widthVars = [
  createVar(),
  createVar(),
  createVar(),
  createVar(),
  createVar(),
  createVar(),
  createVar(),
] as const

const [w0, w1, w2, w3, w4, w5, w6] = widthVars

// Container sets `width: 100%` and `max-width` (from its own `width` prop) on itself, so every
// override needs `&&`. Each breakpoint falls back to the previous one, which is what the min-width
// cascade of the responsive prop did when fewer values were given.
export const popoverContainer = style({
  'selectors': {
    '&&': {
      // Make sure that the Container gets the correct width when used inside a popover.
      width: w0,
      // Make sure that the Container width is constrained by available space.
      maxWidth: '100%',
    },
  },
  '@media': {
    // media[0]
    'screen and (min-width: 360px)': {
      selectors: {'&&': {width: fallbackVar(w1, w0)}},
    },
    // media[1]
    'screen and (min-width: 600px)': {
      selectors: {'&&': {width: fallbackVar(w2, w1, w0)}},
    },
    // media[2]
    'screen and (min-width: 900px)': {
      selectors: {'&&': {width: fallbackVar(w3, w2, w1, w0)}},
    },
    // media[3]
    'screen and (min-width: 1200px)': {
      selectors: {'&&': {width: fallbackVar(w4, w3, w2, w1, w0)}},
    },
    // media[4]
    'screen and (min-width: 1800px)': {
      selectors: {'&&': {width: fallbackVar(w5, w4, w3, w2, w1, w0)}},
    },
    // media[5]
    'screen and (min-width: 2400px)': {
      selectors: {'&&': {width: fallbackVar(w6, w5, w4, w3, w2, w1, w0)}},
    },
  },
})
