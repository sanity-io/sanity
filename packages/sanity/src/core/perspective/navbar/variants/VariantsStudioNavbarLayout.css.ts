import {css} from '#styled-system/css'

/**
 * Pill shell while the filters' chunk loads. Clips the skeleton to the radius.
 * Height stays auto so the border sits outside the skeleton, the same way
 * `GlobalPerspectiveButton`'s card border sits outside its 31px trigger.
 */
export const navbarFallback = css({
  overflow: 'hidden',
})

/** Width and height of the trigger inside `GlobalPerspectiveButton`. */
export const navbarFallbackSkeleton = css({
  width: '116px',
  height: '31px',
})
