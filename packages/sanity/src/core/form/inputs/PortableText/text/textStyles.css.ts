import {createVar, style} from '@vanilla-extract/css'

/** `space[3]` */
export const space3Var = createVar()

/**
 * Without this container, editing with Android breaks due to how Text is styled via `responsiveFont` in `@sanity/ui`
 */
export const textContainer = style({
  display: 'block',
})

export const blockQuoteRoot = style({
  'position': 'relative',
  'display': 'block',
  'margin': 0,
  'paddingLeft': space3Var,

  '::before': {
    content: "''",
    position: 'absolute',
    left: 0,
    top: '-4px',
    bottom: '-4px',
    width: '3px',
    background: 'var(--card-border-color)',
  },
})
