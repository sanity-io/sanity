import {style} from '@vanilla-extract/css'

export const ratioBox = style({
  selectors: {
    '&&': {
      position: 'relative',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
      minHeight: '3.75rem',
      aspectRatio: 'var(--aspect-ratio)',
    },
  },
})

export const ratioBoxPortrait = style({
  selectors: {
    '&&': {
      position: 'relative',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
      minHeight: '3.75rem',
      aspectRatio: 'var(--aspect-ratio)',
      maxHeight: '30dvh',
    },
  },
})
