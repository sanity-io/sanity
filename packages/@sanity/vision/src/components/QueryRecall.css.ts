import {style} from '@vanilla-extract/css'

export const fixedHeader = style({
  position: 'sticky',
  top: 0,
  background: 'var(--card-bg-color)',
  zIndex: 1,
})

export const scrollContainer = style({
  height: 'auto',
  width: '100%',
  minWidth: 0,
  overflow: 'visible',
})
