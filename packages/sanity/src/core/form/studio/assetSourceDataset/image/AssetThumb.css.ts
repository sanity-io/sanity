import {globalStyle, style} from '@vanilla-extract/css'

export const image = style({
  position: 'absolute',
  zIndex: 1,
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  display: 'block',
  objectFit: 'contain',
})

export const container = style({
  selectors: {
    '&&': {
      position: 'relative',
      zIndex: 1,
      paddingBottom: '100%',
    },
  },
})

export const rootDiv = style({
  position: 'relative',
  display: 'inherit',
})

export const menuContainer = style({
  boxSizing: 'border-box',
  position: 'absolute',
  zIndex: 2,
  top: '3px',
  right: '3px',
})

globalStyle(`${menuContainer} button[data-selected]`, {
  display: 'block',
})
