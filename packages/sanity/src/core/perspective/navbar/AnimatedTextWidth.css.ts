import {css} from '#styled-system/css'

export const root = css({
  display: 'inline-block',
  // Top alignment, not the default baseline. An inline-block whose overflow is
  // anything but `visible` reports its bottom edge as its baseline, and the
  // button's line box grows by that shift for the whole animation.
  verticalAlign: 'top',
})

/**
 * The element around a pill's view transition boundary. It generates no box, so the container
 * lays out as if it were not there.
 */
export const pillHost = css({
  display: 'contents',
})
