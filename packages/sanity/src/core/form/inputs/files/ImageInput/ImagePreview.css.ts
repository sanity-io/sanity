import {globalStyle, style} from '@vanilla-extract/css'

export const ratioBox = style({
  position: 'relative',
  width: '100%',
  maxHeight: 'min(calc(var(--image-height) * 1px), 30vh)',
  aspectRatio: 'var(--image-width) / var(--image-height)',
  selectors: {
    // `&&`: Card (Box) sets `min-height: 0` on itself
    '&&': {
      minHeight: '3.75rem',
    },
  },
})

globalStyle(`${ratioBox} img`, {
  display: 'block',
  width: '100%',
  height: '100%',
  objectFit: 'scale-down',
  objectPosition: 'center',
})

export const overlay = style({
  display: 'flex',
  justifyContent: 'flex-end',
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backdropFilter: 'blur(10px)',
  selectors: {
    // `&&`: Card sets `background-color: var(--card-bg-color)` on itself
    '&&': {
      backgroundColor: 'color-mix(in srgb, transparent, var(--card-bg-color) 80%)',
    },
  },
})

export const flexOverlay = style({
  position: 'absolute',
  top: 0,
  left: 0,
  bottom: 0,
  right: 0,
})

export const errorIconWrapper = style({
  alignItems: 'center',
  color: 'var(--card-icon-color)',
  display: 'flex',
  fontSize: '1.5em',
  justifyContent: 'center',
})
