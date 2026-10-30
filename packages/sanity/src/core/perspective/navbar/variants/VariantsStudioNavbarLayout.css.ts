import {css} from '#styled-system/css'

/**
 * Pill shell while the filters' chunk loads. Clips the skeleton to the radius.
 * Height stays auto so the border sits outside the skeleton, the same way
 * `GlobalPerspectiveButton`'s card border sits outside its trigger. The
 * skeleton's height is `--perspective-control-height`, set on this shell.
 */
export const navbarFallback = css({
  overflow: 'hidden',
})

/** `fullWidth`: the shell fills its parent, like a full-width `GlobalPerspectiveButton`. */
export const navbarFallbackFullWidth = css({
  '&&': {
    width: '100%',
  },
})

/** Width and height of the trigger inside `GlobalPerspectiveButton`. */
export const navbarFallbackSkeleton = css({
  width: '116px',
  height: 'var(--perspective-control-height)',
})

/** `fullWidth`: the skeleton fills the shell. */
export const navbarFallbackSkeletonFullWidth = css({
  '&&': {
    width: '100%',
  },
})
