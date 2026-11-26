import {css} from '#styled-system/css'

/**
 * A status mark is its own box: the svg's width and height are the mark's box in whole pixels.
 * It does not shrink in a flex row, and paints outside its box where a stroke's anti-aliasing
 * needs to.
 */
export const statusMark = css({
  '&&': {
    display: 'block',
    flexShrink: 0,
    overflow: 'visible',
  },
})
