import {style} from '@vanilla-extract/css'

export const root = style({
  position: 'relative',
  width: '1px',
  minWidth: '1px',
  selectors: {
    '&:before': {
      content: '""',
      display: 'block',
      position: 'absolute',
      top: 0,
      left: 0,
      bottom: 0,
      width: '1px',
      backgroundColor: 'var(--card-border-color)',
    },
    '&:not([data-disabled])': {
      cursor: 'ew-resize',
      width: '9px',
      minWidth: '9px',
      margin: '0 -4px',
    },
    '&:not([data-disabled]):before': {
      left: '4px',
    },
    '&:not([data-disabled]):after': {
      content: '""',
      display: 'block',
      position: 'absolute',
      top: 0,
      left: 0,
      width: '9px',
      bottom: 0,
      backgroundColor: 'var(--card-border-color)',
      opacity: 0,
      transition: 'opacity 150ms',
    },
    '&:not([data-disabled])[data-dragging]:after, &:not([data-disabled]):hover:after': {
      opacity: 0.2,
    },
  },
})
