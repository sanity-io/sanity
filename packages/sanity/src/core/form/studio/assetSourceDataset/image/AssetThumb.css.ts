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
  position: 'relative',
  zIndex: 1,
  selectors: {
    // `&&`: Card (Box) sets `padding` on itself (`padding` prop, default 0)
    '&&': {
      paddingBottom: '100%',
    },
  },
})

export const root = style({
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

// If hover is supported, hide the buttons until the user hovers or focuses the asset
// Use opacity to enable the buttons to still be focusable
globalStyle(`${menuContainer} button`, {
  '@media': {
    '(hover: hover)': {
      opacity: 0,
    },
  },
})

globalStyle(`${root}:hover ${menuContainer} button, ${root}:focus-within ${menuContainer} button`, {
  '@media': {
    '(hover: hover)': {
      opacity: 1,
    },
  },
})
