import {css, firstThatWorks} from '#styled-system/css'

const STROKE_WIDTH = 0.5

export const root = css({
  // Card (Box) sets `overflow` on itself
  '&&': {
    // `clip` with `hidden` as the fallback for browsers that do not support it.
    overflow: firstThatWorks('clip', 'hidden'),
  },
})

// Card sets `background-color` and (Box) `height` on itself
const barBase = css.raw({
  '&&': {
    height: `${STROKE_WIDTH}rem`,
    transition: 'transform 75ms',
  },
})

/**
 * Keyed by the color scheme (`color._dark`). The colors are `hues.blue[500].hex` and
 * `hues.blue[400].hex` from `@sanity/color`, written out because style values stay literal for the
 * build to rewrite these calls statically.
 */
export const bar = {
  light: css(barBase, {'&&': {background: '#556bfc'}}),
  dark: css(barBase, {'&&': {background: '#7595ff'}}),
}
