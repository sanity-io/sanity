import {createVar, globalStyle, style} from '@vanilla-extract/css'

import {stringDiffContainerStyles} from '../common/diff/string/styles.css'

/** `focusRingBorderStyle({color: color.input.default.enabled.border, width: input.border.width})` */
export const inputBorderBoxShadowVar = createVar()
/** `focusRingStyle({base: color, border, focusRing: input.text.focusRing})` */
export const inputFocusRingBoxShadowVar = createVar()
export const inputBorderWidthVar = createVar()
export const radius2Var = createVar()

export const root = style({
  vars: {
    '--input-box-shadow': inputBorderBoxShadowVar,
  },
  position: 'relative',
})

globalStyle(`${root} [data-wrapper]`, {
  overflow: ['hidden', 'clip'],
  position: 'relative',
  zIndex: 1,
  padding: inputBorderWidthVar,
})

globalStyle(`${root} [data-border]`, {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  boxShadow: 'var(--input-box-shadow)',
  zIndex: 2,
  borderRadius: radius2Var,
  pointerEvents: 'none',
})

globalStyle(`${root}:not([data-read-only])[data-focused] [data-border]`, {
  vars: {
    '--input-box-shadow': inputFocusRingBoxShadowVar,
  },
})

// This element only wraps the input when in "fullscreen" mode
export const expandedLayer = style({
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  selectors: {
    // Layer sets `position: relative` on itself
    '&&': {
      position: 'absolute',
    },
  },
})

globalStyle(`${expandedLayer} > div`, {
  height: '100%',
})

export const stringDiffContainer = style([stringDiffContainerStyles, {height: '100%'}])
