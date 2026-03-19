import {createVar, keyframes, style, globalStyle} from '@vanilla-extract/css'

export const cardHoverBgVar = createVar()
export const cardNormalBgVar = createVar()
export const hoverBorderVar = createVar()

const shimmer = keyframes({
  '0%': {backgroundPosition: '100%'},
  '100%': {backgroundPosition: '-100%'},
})

export const root = style({
  position: 'relative',
  cursor: 'pointer',
})

globalStyle(`.${root} #close-floating-button`, {
  opacity: 0,
  transition: 'opacity 0.2s',
})

globalStyle(`.${root}:hover > [data-ui='whats-new-card']`, {
  backgroundImage: `linear-gradient(to right, var(--card-bg-color), var(--card-bg-color), ${cardNormalBgVar}, var(--card-bg-color), var(--card-bg-color), var(--card-bg-color))`,
  backgroundPosition: '100%',
  backgroundSize: '200% 100%',
  backgroundAttachment: 'fixed',
  animationName: shimmer,
  animationTimingFunction: 'ease-in',
  animationIterationCount: 'infinite',
  animationDuration: '2000ms',
})

globalStyle(`.${root}:hover #close-floating-button`, {
  opacity: 1,
  background: 'transparent',
})

globalStyle(`.${root}:hover #close-floating-button:hover`, {
  transition: 'all 0.2s',
})

export const buttonRoot = style({
  zIndex: 1,
  position: 'absolute',
  top: '2px',
  right: '6px',
})
