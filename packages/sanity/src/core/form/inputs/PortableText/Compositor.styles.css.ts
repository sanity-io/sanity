import {css, firstThatWorks} from '#styled-system/css'

import {stringDiffContainerStylesRaw} from '../common/diff/string/styles.css'

export const inputBorderBoxShadowVar = '--compositor-input-border-box-shadow'
export const inputFocusRingBoxShadowVar = '--compositor-input-focus-ring-box-shadow'
export const inputBorderWidthVar = '--compositor-input-border-width'
export const radius2Var = '--compositor-radius-2'

export const root = css({
  '--input-box-shadow': `var(${inputBorderBoxShadowVar})`,
  'position': 'relative',
  '& [data-wrapper]': {
    overflow: firstThatWorks('clip', 'hidden'),
    position: 'relative',
    zIndex: 1,
    padding: `var(${inputBorderWidthVar})`,
  },
  '& [data-border]': {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    boxShadow: 'var(--input-box-shadow)',
    zIndex: 2,
    borderRadius: `var(${radius2Var})`,
    pointerEvents: 'none',
  },
  '&:not([data-read-only])[data-focused] [data-border]': {
    '--input-box-shadow': `var(${inputFocusRingBoxShadowVar})`,
  },
})

export const expandedLayer = css({
  'top': 0,
  'left': 0,
  'right': 0,
  'bottom': 0,
  '&&': {
    position: 'absolute',
  },
  '& > div': {
    height: '100%',
  },
})

export const stringDiffContainer = css(stringDiffContainerStylesRaw, {
  height: '100%',
})
