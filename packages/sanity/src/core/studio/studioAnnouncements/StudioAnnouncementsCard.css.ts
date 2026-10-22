import {css, keyframes} from '#styled-system/css'

const shimmer = keyframes({
  '0%': {
    backgroundPosition: '100%',
  },
  '100%': {
    backgroundPosition: '-100%',
  },
})

/** `color.selectable.default.hovered.bg`, set on the root by `Root`. */
export const cardHoverBgVar = '--studio-announcements-card-hover-bg'
/** `color.selectable.default.enabled.bg`, set on the root by `Root`. */
export const cardNormalBgVar = '--studio-announcements-card-normal-bg'
/** `color.selectable.default.hovered.border`, set on the root by `Root`. */
export const closeButtonHoverBorderVar = '--studio-announcements-card-close-button-hover-border'

export const root = css({
  'position': 'relative',
  'cursor': 'pointer',
  // hide the close button
  '& #close-floating-button': {
    opacity: 0,
    transition: 'opacity 0.2s',
  },
  "&:hover > [data-ui='whats-new-card']": {
    '--card-bg-color': `var(${cardHoverBgVar})`,
    'boxShadow': 'inset 0 0 2px 1px var(--card-skeleton-color-to)',
    'backgroundImage': `linear-gradient(
    to right,
    var(--card-bg-color),
    var(--card-bg-color),
    var(${cardNormalBgVar}),
    var(--card-bg-color),
    var(--card-bg-color),
    var(--card-bg-color)
  )`,
    'backgroundPosition': '100%',
    'backgroundSize': '200% 100%',
    'backgroundAttachment': 'fixed',
    'animationName': shimmer,
    'animationTimingFunction': 'ease-in',
    'animationIterationCount': 'infinite',
    'animationDuration': '2000ms',
  },
  '&:hover #close-floating-button': {
    opacity: 1,
    background: 'transparent',
  },
  '&:hover #close-floating-button:hover': {
    transition: 'all 0.2s',
    boxShadow: `0 0 0 1px var(${closeButtonHoverBorderVar})`,
  },
})

export const buttonRoot = css({
  zIndex: 1,
  position: 'absolute',
  top: '2px',
  right: '6px',
})
