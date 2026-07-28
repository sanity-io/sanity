import {style} from '@vanilla-extract/css'

export const fixedHeader = style({
  flexShrink: 0,
  background: 'var(--card-bg-color)',
  zIndex: 1,
})

export const scrollContainer = style({
  minHeight: 0,
  width: '100%',
  minWidth: 0,
})

export const queryList = style({
  minHeight: 0,
})
