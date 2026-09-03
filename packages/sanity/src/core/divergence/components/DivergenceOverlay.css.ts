import {createVar, style} from '@vanilla-extract/css'

export const space3Var = createVar()
export const space5Var = createVar()
/** The `anchor-name` of the input the overlay attaches to (`pathToAnchorIdent('input', $path)`). */
export const anchorNameVar = createVar()
/** `$layer.zIndex` */
export const zIndexVar = createVar()

export const divergenceOverlay = style({
  'inlineSize': '100%',
  'marginBlockStart': space3Var,

  '@supports': {
    '(position-anchor: --anchor)': {
      position: 'fixed',
      positionAnchor: anchorNameVar,
      positionArea: 'block-end span-all',
      positionTryFallbacks: 'flip-block',
      inlineSize: `calc(anchor-size(inline) + ${space5Var})`,
      zIndex: zIndexVar,
    },
  },
})
