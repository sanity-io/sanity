import {createVar, globalStyle, style} from '@vanilla-extract/css'

export const gradientColorVar = createVar()

export const horizontalScroller = style({
  selectors: {
    '&&': {
      scrollbarWidth: 'none',
      zIndex: 1,
      flex: 1,
      position: 'relative',
    },
  },
})

globalStyle(`${horizontalScroller} > div::-webkit-scrollbar`, {
  width: 0,
  height: 0,
})

export const horizontalScrollerWithGradient = style({
  selectors: {
    '&&::after': {
      content: "''",
      display: 'block',
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      width: '150px',
      background: `linear-gradient(to right, ${gradientColorVar}, var(--card-bg-color))`,
      transition: 'opacity 300ms ease-out',
      pointerEvents: 'none',
    },
  },
})
