import {style} from '@vanilla-extract/css'

export const scroller = style({
  height: '100%',
})

export const scrollerEnabled = style({
  overflow: 'auto',
  position: 'relative',
  scrollBehavior: 'smooth',
  outline: 'none',
})
