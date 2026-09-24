import {style} from '@vanilla-extract/css'

export const overlay = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  top: '-2px',
  left: '-2px',
  right: '-2px',
  bottom: '-2px',
  backgroundColor: 'var(--card-bg-color)',
  opacity: 0.8,
  selectors: {
    // `&&`: Layer sets `position: relative` on itself
    '&&': {
      position: 'absolute',
    },
  },
})
