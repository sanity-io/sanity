import {globalStyle, keyframes, style} from '@vanilla-extract/css'
import {getVarName, vars} from '@sanity/ui/css'

// Divider styles
export const dividerHrStyle = style({
  height: '1px',
  background: vars.color.border,
  width: '100%',
  transition: 'opacity 0.3s ease',
  margin: 0,
  border: 'none',
})

// Card animation
const shimmerKeyframe = keyframes({
  '0%': {
    backgroundPosition: '100%',
  },
  '100%': {
    backgroundPosition: '-100%',
  },
})

export const cardRootStyle = style({
  position: 'relative',
  cursor: 'pointer',
  selectors: {
    '&:hover [data-ui="whats-new-card"]': {
      [getVarName(vars.color.bg)]: vars.color.tinted.default.bg[1],
      boxShadow: `inset 0 0 2px 1px ${vars.color.skeleton.to}`,
      backgroundImage: `linear-gradient(
        to right,
        ${vars.color.bg},
        ${vars.color.bg},
        ${vars.color.tinted.default.bg[0]},
        ${vars.color.bg},
        ${vars.color.bg},
        ${vars.color.bg}
      )`,
      backgroundPosition: '100%',
      backgroundSize: '200% 100%',
      backgroundAttachment: 'fixed',
      animationName: shimmerKeyframe,
      animationTimingFunction: 'ease-in',
      animationIterationCount: 'infinite',
      animationDuration: '2000ms',
    },
  },
})

globalStyle(`${cardRootStyle} #close-floating-button`, {
  opacity: 0,
  transition: 'opacity 0.2s',
})

globalStyle(`${cardRootStyle}:hover #close-floating-button`, {
  opacity: 1,
  background: 'transparent',
})

globalStyle(`${cardRootStyle}:hover #close-floating-button:hover`, {
  transition: 'all 0.2s',
  boxShadow: `0 0 0 1px ${vars.color.tinted.default.border[2]}`,
})

export const cardButtonRootStyle = style({
  zIndex: 1,
  position: 'absolute',
  top: '0px',
  right: '6px',
})

// Dialog styles
export const dialogRootStyle = style({
  overflow: 'auto',
  maxHeight: '75vh',
})

export const dialogHeaderStyle = style({
  position: 'sticky',
  display: 'grid',
  gridTemplateColumns: '64px 1fr 64px',
  top: 0,
  zIndex: 1,
  background: vars.color.bg,
})

export const dialogFloatingButtonBoxStyle = style({
  position: 'absolute',
  top: '12px',
  right: '24px',
  zIndex: 2,
})

// Schema errors styles
export const segmentSpanStyle = style({
  background: 'none',
  color: 'inherit',
})

export const errorMessageTextStyle = style({
  whiteSpace: 'pre-line',
})
