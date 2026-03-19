import {style} from '@vanilla-extract/css'

export const scroller = style({
  position: 'relative',
  height: '100%',
  overflow: 'auto',
  scrollBehavior: 'smooth',
  scrollbarWidth: 'var(--scrollbar-width)' as any,
  overscrollBehavior: 'contain',
  willChange: 'scroll-position',
})
