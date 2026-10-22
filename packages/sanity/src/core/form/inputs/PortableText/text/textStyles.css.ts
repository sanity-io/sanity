import {css} from '#styled-system/css'

/** `space[3]` */
export const space3Var = '--text-styles-space-3'

/**
 * Without this container, editing with Android breaks due to how Text is styled via `responsiveFont` in `@sanity/ui`
 */
export const textContainer = css({
  display: 'block',
})

export const blockQuoteRoot = css({
  'position': 'relative',
  'display': 'block',
  'margin': 0,
  'paddingLeft': `var(${space3Var})`,
  '&::before': {
    content: "''",
    position: 'absolute',
    left: 0,
    top: '-4px',
    bottom: '-4px',
    width: '3px',
    background: 'var(--card-border-color)',
  },
})
