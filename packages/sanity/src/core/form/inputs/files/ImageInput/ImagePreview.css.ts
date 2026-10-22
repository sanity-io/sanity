import {css} from '#styled-system/css'

export const ratioBox = css({
  'position': 'relative',
  'width': '100%',
  'maxHeight': 'min(calc(var(--image-height) * 1px), 30vh)',
  'aspectRatio': 'var(--image-width) / var(--image-height)',
  // `&&`: Card (Box) sets `min-height: 0` on itself
  '&&': {
    minHeight: '3.75rem',
  },
  '& img': {
    display: 'block',
    width: '100%',
    height: '100%',
    objectFit: 'scale-down',
    objectPosition: 'center',
  },
})

export const overlay = css({
  'justifyContent': 'flex-end',
  'position': 'absolute',
  'top': 0,
  'left': 0,
  'right': 0,
  'bottom': 0,
  'backdropFilter': 'blur(10px)',
  // `&&`: Card sets its own `display` and `background-color: var(--card-bg-color)`
  '&&': {
    display: 'flex',
    backgroundColor: 'color-mix(in srgb, transparent, var(--card-bg-color) 80%)',
  },
})

export const flexOverlay = css({
  position: 'absolute',
  top: 0,
  left: 0,
  bottom: 0,
  right: 0,
})

export const errorIconWrapper = css({
  alignItems: 'center',
  display: 'flex',
  justifyContent: 'center',
})
