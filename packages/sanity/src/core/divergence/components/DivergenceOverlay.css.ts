import {css} from '#styled-system/css'

export const space3Var = '--divergence-overlay-space-3'
export const space5Var = '--divergence-overlay-space-5'
/** The `anchor-name` of the input the overlay attaches to (`pathToAnchorIdent('input', $path)`). */
export const anchorNameVar = '--divergence-overlay-anchor-name'
/** `$layer.zIndex` */
export const zIndexVar = '--divergence-overlay-z-index'

export const divergenceOverlay = css({
  'inlineSize': '100%',
  'marginBlockStart': `var(${space3Var})`,
  '@supports (position-anchor: --anchor)': {
    position: 'fixed',
    positionAnchor: `var(${anchorNameVar})`,
    positionArea: 'block-end span-all',
    positionTryFallbacks: 'flip-block',
    inlineSize: `calc(anchor-size(inline) + var(${space5Var}))`,
    zIndex: `var(${zIndexVar})`,
  },
})
