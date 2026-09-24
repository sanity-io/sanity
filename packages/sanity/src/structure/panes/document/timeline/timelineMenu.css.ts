import {style} from '@vanilla-extract/css'

export const root = style({
  // `clip` with `hidden` as the fallback for browsers that do not support it.
  overflow: ['hidden', 'clip'],
})
