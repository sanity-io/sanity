import {style} from '@vanilla-extract/css'

export const resizer = style({
  position: 'relative',
})

export const resizerHidden = style({
  display: 'none',
})

export const resizerInner = style({
  position: 'absolute',
  top: 0,
  bottom: 0,
  left: '-5px',
  width: '9px',
  zIndex: 10,
})

export const resizerInnerDisabled = style({
  cursor: 'auto',
})

export const resizerInnerEnabled = style({
  cursor: 'ew-resize',
})

/* Border */
export const resizerBorder = style({
  display: 'block',
  borderLeft: '1px solid var(--card-border-color)',
  position: 'absolute',
  top: 0,
  left: '4px',
  bottom: 0,
  transition: 'opacity 200ms',
})

/* Hover effect (only applied while the resizer is enabled) */
export const resizerHoverEffect = style({
  'display': 'block',
  'position': 'absolute',
  'top': 0,
  'left': 0,
  'width': '9px',
  'bottom': 0,
  'backgroundColor': 'var(--card-border-color)',
  'opacity': 0,
  'transition': 'opacity 150ms',
  '@media': {
    '(hover: hover)': {
      selectors: {
        [`${resizerInner}:hover > &`]: {
          opacity: 0.2,
        },
      },
    },
  },
})
