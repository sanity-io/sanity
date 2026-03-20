import {createVar, globalStyle, style} from '@vanilla-extract/css'

export const inputBoxShadowVar = createVar()
export const focusBoxShadowVar = createVar()
export const borderRadiusVar = createVar()
export const borderWidthVar = createVar()

export const root = style({
  position: 'relative',
  vars: {
    '--input-box-shadow': inputBoxShadowVar,
  },
})

globalStyle(`${root} [data-wrapper]`, {
  overflow: 'hidden',
  position: 'relative',
  zIndex: 1,
  padding: borderWidthVar,
})

globalStyle(`${root} [data-border]`, {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  boxShadow: 'var(--input-box-shadow)',
  zIndex: 2,
  borderRadius: borderRadiusVar,
  pointerEvents: 'none',
})

globalStyle(`${root}:not([data-read-only])[data-focused] [data-border]`, {
  vars: {
    '--input-box-shadow': focusBoxShadowVar,
  },
})

export const expandedLayer = style({
  selectors: {
    '&&': {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
  },
})

globalStyle(`${expandedLayer} > div`, {
  height: '100%',
})

export const stringDiffContainer = style({
  height: '100%',
})
