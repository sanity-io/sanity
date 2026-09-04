import {createVar, globalStyle, keyframes, style} from '@vanilla-extract/css'

const shimmer = keyframes({
  '0%': {backgroundPosition: '100%'},
  '100%': {backgroundPosition: '-100%'},
})

/** `color.selectable.default.hovered.bg`, set on the root by `Root`. */
export const cardHoverBgVar = createVar()
/** `color.selectable.default.enabled.bg`, set on the root by `Root`. */
export const cardNormalBgVar = createVar()
/** `color.selectable.default.hovered.border`, set on the root by `Root`. */
export const closeButtonHoverBorderVar = createVar()

export const root = style({
  position: 'relative',
  cursor: 'pointer',
})

// hide the close button
globalStyle(`${root} #close-floating-button`, {
  opacity: 0,
  transition: 'opacity 0.2s',
})

globalStyle(`${root}:hover > [data-ui='whats-new-card']`, {
  vars: {'--card-bg-color': cardHoverBgVar},
  boxShadow: 'inset 0 0 2px 1px var(--card-skeleton-color-to)',
  backgroundImage: `linear-gradient(
    to right,
    var(--card-bg-color),
    var(--card-bg-color),
    ${cardNormalBgVar},
    var(--card-bg-color),
    var(--card-bg-color),
    var(--card-bg-color)
  )`,
  backgroundPosition: '100%',
  backgroundSize: '200% 100%',
  backgroundAttachment: 'fixed',
  animationName: shimmer,
  animationTimingFunction: 'ease-in',
  animationIterationCount: 'infinite',
  animationDuration: '2000ms',
})

globalStyle(`${root}:hover #close-floating-button`, {
  opacity: 1,
  background: 'transparent',
})

globalStyle(`${root}:hover #close-floating-button:hover`, {
  transition: 'all 0.2s',
  boxShadow: `0 0 0 1px ${closeButtonHoverBorderVar}`,
})

export const buttonRoot = style({
  zIndex: 1,
  position: 'absolute',
  top: '2px',
  right: '6px',
})
