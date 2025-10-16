import {style, styleVariants} from '@vanilla-extract/css'
import {vars} from '@sanity/ui/css'

const baseRootStyle = style({
  position: 'absolute',
  top: 0,
  bottom: 0,
  width: '9px',
  zIndex: 201,
  cursor: 'ew-resize',
})

export const rootStyles = styleVariants({
  left: [
    baseRootStyle,
    style({
      left: '-4px',
    }),
  ],
  right: [
    baseRootStyle,
    style({
      right: '-4px',
    }),
  ],
})

const baseBorderStyle = style({
  display: 'block',
  borderLeft: `1px solid ${vars.color.border}`,
  position: 'absolute',
  top: 0,
  bottom: 0,
  transition: 'opacity 200ms',
})

export const borderStyles = styleVariants({
  left: [
    baseBorderStyle,
    style({
      left: '4px',
    }),
  ],
  right: [
    baseBorderStyle,
    style({
      right: '4px',
    }),
  ],
})

const baseHoverEffectStyle = style({
  display: 'block',
  position: 'absolute',
  top: 0,
  width: '9px',
  bottom: 0,
  backgroundColor: vars.color.border,
  opacity: 0,
  transition: 'opacity 150ms',
})

export const hoverEffectStyles = styleVariants({
  left: [
    baseHoverEffectStyle,
    style({
      left: '0px',
    }),
  ],
  right: [
    baseHoverEffectStyle,
    style({
      right: '0px',
    }),
  ],
})

// Apply hover effect only on hover-capable devices
export const hoverEffectHoverStyle = style({
  '@media': {
    '(hover: hover)': {
      selectors: {
        [`${rootStyles.left}:hover &, ${rootStyles.right}:hover &`]: {
          opacity: 0.2,
        },
      },
    },
  },
})
