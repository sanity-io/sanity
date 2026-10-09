import {hues} from '@sanity/color'
import {style, styleVariants} from '@vanilla-extract/css'

const STROKE_WIDTH = 0.5

export const root = style({
  selectors: {
    // Card (Box) sets `overflow` on itself
    '&&': {
      overflow: ['hidden', 'clip'],
    },
  },
})

// Card sets `background-color` and (Box) `height` on itself
const barBase = {
  height: `${STROKE_WIDTH}rem`,
  transition: 'transform 75ms',
}

/** Keyed by the color scheme (`color._dark`) */
export const bar = styleVariants({
  light: {
    selectors: {
      '&&': {...barBase, background: hues.blue[500].hex},
    },
  },
  dark: {
    selectors: {
      '&&': {...barBase, background: hues.blue[400].hex},
    },
  },
})
