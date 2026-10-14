import {style} from '@vanilla-extract/css'

export const ratioBox = style({
  position: 'relative',
  // Kept at single-class specificity on purpose: Box's own `&:not([hidden]) {display: block}`
  // rule (0,2,0) already beat this declaration before the migration, so raising it here would
  // change the rendering.
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  width: '100%',
  aspectRatio: 'var(--aspect-ratio)',
  selectors: {
    // Card (via Box's flex-item base style) sets `min-height: 0` on itself
    '&&': {
      minHeight: '3.75rem',
    },
  },
})

/* Apply max-height constraint only for portrait videos (aspect ratio < 0.75) */
export const ratioBoxPortrait = style({
  maxHeight: '30dvh',
})
