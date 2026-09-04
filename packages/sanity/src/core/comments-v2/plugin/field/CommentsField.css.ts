import {hues} from '@sanity/color'
import {createVar, style, styleVariants} from '@vanilla-extract/css'

import {COMMENTS_HIGHLIGHT_HUE_KEY} from '../../constants'

// radius[3]
export const radius3Var = createVar()
// space[2]
export const space2Var = createVar()

const highlightBase = style({
  borderRadius: radius3Var,
  top: `calc(-1 * ${space2Var})`,
  left: `calc(-1 * ${space2Var})`,
  bottom: `calc(-1 * ${space2Var})`,
  right: `calc(-1 * ${space2Var})`,
  pointerEvents: 'none',
  position: 'absolute',
  zIndex: 1,
  width: `calc(100% + ${space2Var} * 2)`,
  height: `calc(100% + ${space2Var} * 2)`,
})

export const highlightDiv = styleVariants({
  light: [
    highlightBase,
    {
      mixBlendMode: 'multiply',
      backgroundColor: hues[COMMENTS_HIGHLIGHT_HUE_KEY][50].hex,
    },
  ],
  dark: [
    highlightBase,
    {
      mixBlendMode: 'screen',
      backgroundColor: hues[COMMENTS_HIGHLIGHT_HUE_KEY][900].hex,
    },
  ],
})

export const fieldStack = style({
  position: 'relative',

  selectors: {
    // Hide when the field component renders nothing (e.g. a custom
    // field component that returns null) to avoid an empty wrapper
    // taking up space in the form.
    '&:empty:not([hidden])': {
      display: 'none',
    },
  },
})
