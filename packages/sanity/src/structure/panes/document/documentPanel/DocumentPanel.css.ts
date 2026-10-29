import {css} from '#styled-system/css'

export const documentBox = css({
  position: 'relative',
})

export const scroller = css({
  height: '100%',
})

export const scrollerEnabled = css({
  overflow: 'auto',
  position: 'relative',
  scrollBehavior: 'smooth',
  outline: 'none',
})
