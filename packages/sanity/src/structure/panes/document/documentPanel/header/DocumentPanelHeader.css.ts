import {css} from '#styled-system/css'

export const gradientFromColorVar = '--document-panel-header-gradient-from-color'

export const horizontalScroller = css({
  'scrollbarWidth': 'none',
  'zIndex': 1,
  'flex': 1,
  'position': 'relative',
  '& > div::-webkit-scrollbar': {
    width: 0,
    height: 0,
  },
})

export const horizontalScrollerGradient = css({
  '&::after': {
    content: "''",
    display: 'block',
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: '150px',
    background: `linear-gradient(to right, var(${gradientFromColorVar}), var(--card-bg-color))`,
    pointerEvents: 'none',
  },
})
