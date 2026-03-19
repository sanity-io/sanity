import {style} from '@vanilla-extract/css'

export const root = style({
  selectors: {
    '&&': {
      position: 'relative',
      width: '1px',
      minWidth: '1px',
    },
    '&&:before': {
      content: "''",
      display: 'block',
      position: 'absolute',
      top: 0,
      left: 0,
      bottom: 0,
      width: '1px',
      backgroundColor: 'var(--card-border-color)',
    },
    '&&:not([data-disabled])': {
      cursor: 'ew-resize',
      width: '9px',
      minWidth: '9px',
      margin: '0 -4px',
    },
    '&&:not([data-disabled]):before': {
      left: '4px',
    },
    '&&:not([data-disabled]):after': {
      content: "''",
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
    '&&[data-dragging]:after': {
      opacity: 0.2,
    },
    '&&:hover:after': {
      opacity: 0.2,
    },
  },
})
