import {css, keyframes} from '#styled-system/css'

/** `${space[4]}px` */
export const space4Var = '--body-space-4'
/** `${space[5]}px` */
export const space5Var = '--body-space-5'

// Registered as `<color>` with `@property` (`globalVars` in `packages/sanity/panda.config.ts`),
// so the keyframes below can animate them; kept under their original global names
const startMaskColor = '--start-mask-color'
const endMaskColor = '--end-mask-color'

const fadeMask = keyframes({
  '0%': {
    [startMaskColor]: '#000',
    [endMaskColor]: 'transparent',
  },
  '2%, 98%': {
    [startMaskColor]: 'transparent',
    [endMaskColor]: 'transparent',
  },
  '100%': {
    [startMaskColor]: 'transparent',
    [endMaskColor]: '#000',
  },
})

export const body = css({
  '--mask-size': '3rem',
  'overflowX': 'clip',
  'overflowY': 'auto',
  'overscrollBehavior': 'contain',
  'padding': `calc(var(${space5Var}) * 0.5) calc(var(${space4Var}))`,
  'maskImage': `linear-gradient(
    to var(--direction, bottom),
    var(${startMaskColor}),
    #000 var(--mask-size),
    #000 calc(100% - var(--mask-size)),
    var(${endMaskColor})
  )`,
  'maskPosition': '0% 0%',
  'maskRepeat': 'no-repeat',
  'maskSize': '100% 100%',
  'animation': fadeMask,
  'animationTimeline': 'scroll(self y)',
})
