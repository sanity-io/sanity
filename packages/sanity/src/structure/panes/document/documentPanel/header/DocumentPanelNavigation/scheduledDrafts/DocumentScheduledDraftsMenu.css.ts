import {css} from '#styled-system/css'

/**
 * The lock of a paused scheduled draft, drawn at the size and place of the clock it replaces.
 * The lock glyph is wider than the clock and sits left of its box's centre, which put it against
 * the pill's left edge.
 */
export const pausedIcon = css({
  transform: 'translateX(1px) scale(0.8)',
})
