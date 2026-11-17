import {css} from '#styled-system/css'

export const scroller = css({
  position: 'relative',
  height: '100%',
  overflow: 'auto',
  scrollBehavior: 'smooth',
  // The brackets are Panda's escape hatch from `strictPropertyValues`, which otherwise only accepts
  // the keywords of `scrollbar-width`; the emitted value is `var(--scrollbar-width)`
  scrollbarWidth: '[var(--scrollbar-width)]',
  overscrollBehavior: 'contain',
  willChange: 'scroll-position',
})
