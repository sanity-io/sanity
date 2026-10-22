import {css} from '#styled-system/css'

const w0 = '--popover-container-width-0'
const w1 = '--popover-container-width-1'
const w2 = '--popover-container-width-2'
const w3 = '--popover-container-width-3'
const w4 = '--popover-container-width-4'
const w5 = '--popover-container-width-5'
const w6 = '--popover-container-width-6'

/**
 * `rem(container[width[n]])` for each entry of the responsive `width` prop (`100%` for `'auto'`),
 * index 0 being the base value and index n applying from `media[n - 1]` upwards.
 */
export const widthVars = [w0, w1, w2, w3, w4, w5, w6] as const

// Container sets `width: 100%` and `max-width` (from its own `width` prop) on itself, so every
// override needs `&&`. Each breakpoint falls back to the previous one, which is what the min-width
// cascade of the responsive prop did when fewer values were given.
export const popoverContainer = css({
  '&&': {
    // Make sure that the Container gets the correct width when used inside a popover.
    width: `var(${w0})`,
    // Make sure that the Container width is constrained by available space.
    maxWidth: '100%',
  },
  // media[0]
  '@media screen and (min-width: 360px)': {
    '&&': {width: `var(${w1}, var(${w0}))`},
  },
  // media[1]
  '@media screen and (min-width: 600px)': {
    '&&': {width: `var(${w2}, var(${w1}, var(${w0})))`},
  },
  // media[2]
  '@media screen and (min-width: 900px)': {
    '&&': {width: `var(${w3}, var(${w2}, var(${w1}, var(${w0}))))`},
  },
  // media[3]
  '@media screen and (min-width: 1200px)': {
    '&&': {width: `var(${w4}, var(${w3}, var(${w2}, var(${w1}, var(${w0})))))`},
  },
  // media[4]
  '@media screen and (min-width: 1800px)': {
    '&&': {width: `var(${w5}, var(${w4}, var(${w3}, var(${w2}, var(${w1}, var(${w0}))))))`},
  },
  // media[5]
  '@media screen and (min-width: 2400px)': {
    '&&': {
      width: `var(${w6}, var(${w5}, var(${w4}, var(${w3}, var(${w2}, var(${w1}, var(${w0})))))))`,
    },
  },
})
