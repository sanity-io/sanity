import {globalStyle, style} from '@vanilla-extract/css'
import {vars} from '@sanity/ui/css'

const rem = (value: number) => `${value / 16}rem`

export const rootBoxStyle = style({
  position: 'relative',
})

export const mediaFlexStyle = style({
  position: 'absolute',
  left: 0,
  top: 0,
  right: 0,
  bottom: 0,
})

export const mediaSkeletonStyle = style({
  width: '100%',
  height: '100%',
})

export const progressFlexStyle = style({
  position: 'absolute',
  left: 0,
  top: 0,
  right: 0,
  bottom: 0,
  selectors: {
    '&::before': {
      backgroundColor: vars.color.bg,
      opacity: 0.75,
      content: '""',
      display: 'block',
      position: 'absolute',
      left: 0,
      top: 0,
      right: 0,
      bottom: 0,
    },
  },
})

globalStyle(`${progressFlexStyle} > svg`, {
  position: 'relative',
  zIndex: 2,
})

export const tooltipContentStackStyle = style({
  maxWidth: rem(200),
})
