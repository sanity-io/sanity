import {css, firstThatWorks} from '#styled-system/css'

const STROKE_WIDTH = 0.5

export const root = css({
  // Card (Box) sets `overflow` on itself
  '&&': {
    overflow: firstThatWorks('clip', 'hidden'),
  },
})

// Card sets `background-color` and (Box) `height` on itself
const barBase = {
  height: `${STROKE_WIDTH}rem`,
  transition: 'transform 75ms',
}

/** Keyed by the color scheme (`color._dark`) */
export const bar = {
  light: css({
    '&&': {
      ...barBase,
      // hues.blue[500]
      background: '#556bfc',
    },
  }),
  dark: css({
    '&&': {
      ...barBase,
      // hues.blue[400]
      background: '#7595ff',
    },
  }),
}
