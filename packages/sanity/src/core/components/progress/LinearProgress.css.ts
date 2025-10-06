import {style} from '@vanilla-extract/css'
import {vars} from '@sanity/ui/css'

const STROKE_WIDTH = 0.5

export const rootStyle = style({
  overflow: 'clip',
})

export const barStyle = style({
  height: `${STROKE_WIDTH}rem`,
  background: vars.color.solid.primary.bg[0],
  transition: 'transform 75ms',
})
