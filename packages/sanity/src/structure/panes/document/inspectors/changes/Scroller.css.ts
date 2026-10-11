import {style} from '@vanilla-extract/css'

export const scroller = style({
  height: '100%',
  overflow: 'auto',
  position: 'relative',
  scrollBehavior: 'smooth',
})
