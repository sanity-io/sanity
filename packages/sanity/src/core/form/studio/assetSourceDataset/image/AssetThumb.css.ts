import {css} from '#styled-system/css'

export const image = css({
  position: 'absolute',
  zIndex: 1,
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  display: 'block',
  objectFit: 'contain',
})

export const container = css({
  'position': 'relative',
  'zIndex': 1,
  // `&&`: Card (Box) sets `padding` on itself (`padding` prop, default 0)
  '&&': {
    paddingBottom: '100%',
  },
})

export const root = css({
  position: 'relative',
  display: 'inherit',
})

export const menuContainer = css({
  'boxSizing': 'border-box',
  'position': 'absolute',
  'zIndex': 2,
  'top': '3px',
  'right': '3px',
  '& button[data-selected]': {
    display: 'block',
  },
  // If hover is supported, hide the buttons until the user hovers or focuses the asset
  // Use opacity to enable the buttons to still be focusable
  '& button': {
    '@media (hover: hover)': {
      opacity: 0,
    },
  },
  // `data-asset-thumb` is rendered by the element with the `root` class
  '[data-asset-thumb]:hover &, [data-asset-thumb]:focus-within &': {
    '& button': {
      '@media (hover: hover)': {
        opacity: 1,
      },
    },
  },
})
