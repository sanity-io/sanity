import {css} from '#styled-system/css'

export const imageWrapper = css({
  'height': '100%',
  'maxHeight': '190px',
  'position': 'relative',
  // Ideally the checkerboard component currently in the form builder should be made available and used here
  // hues.gray[100]
  'backgroundColor': '#eeeef1',
  // hues.gray[50]
  'backgroundImage': `
    linear-gradient(45deg, #f6f6f8 25%, transparent 25%),
    linear-gradient(-45deg, #f6f6f8 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #f6f6f8 75%),
    linear-gradient(-45deg, transparent 75%, #f6f6f8 75%)`,
  'backgroundSize': '16px 16px',
  'backgroundPosition': `
    0 0,
    0 8px,
    8px -8px,
    -8px 0`,
  '&::after': {
    content: '""',
    display: 'block',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    boxShadow: 'inset 0 0 0 1px var(--card-border-color)',
    pointerEvents: 'none',
  },
  '&[data-changed]': {
    opacity: 0.45,
  },
})

export const image = css({
  'display': 'block',
  'flex': 1,
  'minHeight': 0,
  'objectFit': 'contain',
  'width': '100%',
  'height': '100%',
  "&[data-action='removed']": {
    opacity: 0.45,
  },
})

export const hotspotDiff = css({
  '& svg': {
    display: 'block',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
})
