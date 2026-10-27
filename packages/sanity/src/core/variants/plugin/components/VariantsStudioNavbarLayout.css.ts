import {css} from '#styled-system/css'

/** Pill shell while the filters' chunk loads. Clips the skeleton to the radius. */
export const navbarFallback = css({
  height: '31px',
  overflow: 'hidden',
})

/** Width of the default perspective chip. */
export const navbarFallbackSkeleton = css({
  width: '116px',
  height: '100%',
})
