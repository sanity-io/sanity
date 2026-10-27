import {css} from '#styled-system/css'

export const radius3Var = '--review-changes-highlight-block-radius-3'
export const space1Var = '--review-changes-highlight-block-space-1'
export const space2Var = '--review-changes-highlight-block-space-2'
export const space4Var = '--review-changes-highlight-block-space-4'
/** `rgba(color.avatar.yellow.bg, 0.2)` (the legacy theme's `color.spot.yellow`) */
export const bgColorVar = '--review-changes-highlight-block-bg-color'

export const root = css({
  position: 'absolute',
  borderRadius: `var(${radius3Var})`,
  top: `calc(-1 * var(${space2Var}))`,
  bottom: `calc(-1 * (var(${space1Var}) + var(${space1Var})))`,
  left: `var(${space1Var})`,
  right: `var(${space1Var})`,
  backgroundColor: `var(${bgColorVar})`,
  pointerEvents: 'none',
})

// Follows `root` on the same element; `&&` keeps it winning
export const rootFullScreen = css({
  '&&': {
    left: `calc(var(${space4Var}) + var(${space1Var}))`,
  },
})
