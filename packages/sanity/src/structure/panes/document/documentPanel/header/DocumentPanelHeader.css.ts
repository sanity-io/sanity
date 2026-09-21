import {createVar, globalStyle, style} from '@vanilla-extract/css'

export const gradientFromColorVar = createVar()

export const horizontalScroller = style({
  scrollbarWidth: 'none',
  zIndex: 1,
  flex: 1,
  position: 'relative',
})

globalStyle(`${horizontalScroller} > div::-webkit-scrollbar`, {
  width: 0,
  height: 0,
})

export const horizontalScrollerGradient = style({
  '::after': {
    content: "''",
    display: 'block',
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: '150px',
    background: `linear-gradient(to right, ${gradientFromColorVar}, var(--card-bg-color))`,
    pointerEvents: 'none',
  },
})
