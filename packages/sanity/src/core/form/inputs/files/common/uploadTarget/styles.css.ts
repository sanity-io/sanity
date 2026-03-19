import {style} from '@vanilla-extract/css'

export const overlay = style({
  selectors: {
    '&&': {
      position: 'absolute',
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
    },
  },
})
