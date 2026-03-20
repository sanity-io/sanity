import {style, styleVariants} from '@vanilla-extract/css'

const resizerBase = style({
  position: 'absolute',
  top: 0,
  bottom: 0,
  width: '9px',
  zIndex: 201,
  cursor: 'ew-resize',
})

export const resizerRoot = styleVariants({
  left: [resizerBase, { left: '-4px' }],
  right: [resizerBase, { right: '-4px' }],
})

/* Border span */
const borderSpanBase = style({
  display: 'block',
  borderLeft: '1px solid var(--card-border-color)',
  position: 'absolute',
  top: 0,
  bottom: 0,
  transition: 'opacity 200ms',
})

export const borderSpan = styleVariants({
  left: [borderSpanBase, { left: '4px' }],
  right: [borderSpanBase, { right: '4px' }],
})

/* Hover effect span */
const hoverSpanBase = style({
  display: 'block',
  position: 'absolute',
  top: 0,
  width: '9px',
  bottom: 0,
  backgroundColor: 'var(--card-border-color)',
  opacity: 0,
  transition: 'opacity 150ms',
})

export const hoverSpan = styleVariants({
  left: [hoverSpanBase, { left: '0px' }],
  right: [hoverSpanBase, { right: '0px' }],
})

// Hover effect: when parent is hovered, show the hover span
// We use selectors on the hover span itself, referencing the parent
export const hoverSpanWithHover = style({
  '@media': {
    '(hover: hover)': {
      selectors: {
        [`${resizerBase}:hover > &`]: {
          opacity: 0.2,
        },
      },
    },
  },
})
