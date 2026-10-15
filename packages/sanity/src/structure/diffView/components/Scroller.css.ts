import {css} from '#styled-system/css'

export const scroller = css({
  position: 'relative',
  height: '100%',
  overflow: 'auto',
  scrollBehavior: 'smooth',
  scrollbarWidth: 'var(--scrollbar-width)',
  overscrollBehavior: 'contain',
  willChange: 'scroll-position',
})
