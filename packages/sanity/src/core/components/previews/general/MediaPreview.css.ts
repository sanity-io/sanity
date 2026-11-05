import {css} from '#styled-system/css'

export const rootBox = css({
  position: 'relative',
})

export const mediaFlex = css({
  position: 'absolute',
  left: 0,
  top: 0,
  right: 0,
  bottom: 0,
})

export const mediaSkeleton = css({
  // Skeleton sets its own dimensions
  '&&': {
    width: '100%',
    height: '100%',
  },
})

export const progressFlex = css({
  'position': 'absolute',
  'left': 0,
  'top': 0,
  'right': 0,
  'bottom': 0,
  '&::before': {
    backgroundColor: 'var(--card-bg-color)',
    opacity: 0.75,
    content: '""',
    display: 'block',
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  },
  '& > svg': {
    position: 'relative',
    zIndex: 2,
  },
})

export const tooltipContentStack = css({
  maxWidth: `${200 / 16}rem`,
})
