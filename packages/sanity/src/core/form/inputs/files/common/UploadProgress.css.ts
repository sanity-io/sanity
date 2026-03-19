import {globalStyle, style} from '@vanilla-extract/css'

export const cardWrapper = style({
  selectors: {
    '&&': {
      boxSizing: 'border-box',
      position: 'relative',
      width: '100%',
      minHeight: '3.75rem',
      maxHeight: 'min(calc(var(--image-height) * 1px), 30vh)',
      aspectRatio: 'var(--image-width) / var(--image-height)',
    },
  },
})

export const flexWrapper = style({
  selectors: {
    '&&': {
      boxSizing: 'border-box',
      textOverflow: 'ellipsis',
      overflow: 'clip',
    },
  },
})

export const leftSection = style({
  selectors: {
    '&&': {
      position: 'relative',
      width: '60%',
    },
  },
})

export const codeWrapper = style({
  selectors: {
    '&&': {
      position: 'relative',
      width: '100%',
    },
  },
})

globalStyle(`${codeWrapper} code`, {
  overflow: 'clip',
  textOverflow: 'ellipsis',
  position: 'relative',
  maxWidth: '200px',
})
