import {style} from '@vanilla-extract/css'

export const ratioBox = style({
  position: 'relative',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  width: '100%',
  aspectRatio: 'var(--aspect-ratio)',
  selectors: {
    '&&': {
      minHeight: '3.75rem',
    },
  },
})

/* Apply max-height constraint only for portrait videos (aspect ratio < 0.75) */
export const ratioBoxPortrait = style({
  maxHeight: '30dvh',
})
