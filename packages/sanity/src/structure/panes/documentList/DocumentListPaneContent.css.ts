import {style} from '@vanilla-extract/css'

export const rootBox = style({
  position: 'relative',
  opacity: 1,
  transition: 'opacity 0.4s',
})

// Defined after `rootBox` so it wins the equal-specificity tie on `opacity`.
export const rootBoxMuted = style({
  opacity: 0.8,
})

export const commandListBox = style({
  position: 'absolute',
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
})
