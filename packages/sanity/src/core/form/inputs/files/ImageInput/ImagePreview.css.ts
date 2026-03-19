import {style} from '@vanilla-extract/css'

export const ratioBox = style({
  selectors: {
    '&&': {
      position: 'relative',
      width: '100%',
      minHeight: '3.75rem',
      maxHeight: 'min(calc(var(--image-height) * 1px), 30vh)',
      aspectRatio: 'var(--image-width) / var(--image-height)',
    },
  },
})

export const ratioBoxImage = style({
  display: 'block',
  width: '100%',
  height: '100%',
  objectFit: 'scale-down',
  objectPosition: 'center',
})

export const image = style({
  selectors: {
    '&&': {
      display: 'block',
      width: '100%',
      height: '100%',
    },
  },
})
export const overlay = style({
  selectors: {
    '&&': {
      display: 'flex',
      justifyContent: 'flex-end',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backdropFilter: 'blur(10px)',
      backgroundColor: 'color-mix(in srgb, transparent, var(--card-bg-color) 80%)',
    },
  },
})

export const flexOverlay = style({
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

export const errorIconWrapper = style({
  selectors: {
    '&&': {
      alignItems: 'center',
      color: 'var(--card-icon-color)',
      display: 'flex',
      fontSize: '1.5em',
      justifyContent: 'center',
    },
  },
})
