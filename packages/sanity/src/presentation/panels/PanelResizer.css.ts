import {css} from '#styled-system/css'

export const resizer = css({
  position: 'relative',
})

export const resizerHidden = css({
  display: 'none',
})

export const resizerInner = css({
  position: 'absolute',
  top: 0,
  bottom: 0,
  left: '-5px',
  width: '9px',
  zIndex: 10,
})

export const resizerInnerDisabled = css({
  cursor: 'auto',
})

export const resizerInnerEnabled = css({
  cursor: 'ew-resize',
})

/* Border */
export const resizerBorder = css({
  display: 'block',
  borderLeft: '1px solid var(--card-border-color)',
  position: 'absolute',
  top: 0,
  left: '4px',
  bottom: 0,
  transition: 'opacity 200ms',
})

/* Hover effect (only applied while the resizer is enabled) */
export const resizerHoverEffect = css({
  'display': 'block',
  'position': 'absolute',
  'top': 0,
  'left': 0,
  'width': '9px',
  'bottom': 0,
  'backgroundColor': 'var(--card-border-color)',
  'opacity': 0,
  'transition': 'opacity 150ms',
  '@media (hover: hover)': {
    // `data-panel-resizer-inner` is rendered by the element with the `resizerInner` class
    '[data-panel-resizer-inner]:hover > &': {
      opacity: 0.2,
    },
  },
})
