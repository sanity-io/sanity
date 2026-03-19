import {globalStyle, style} from '@vanilla-extract/css'

export const imageWrapper = style({
  height: '100%',
  maxHeight: '190px',
  position: 'relative',
  /* Ideally the checkerboard component currently in the form builder should be made available and used here */
  backgroundColor: '#f2f3f5',
  backgroundImage: [
    'linear-gradient(45deg, #e6e8eb 25%, transparent 25%)',
    'linear-gradient(-45deg, #e6e8eb 25%, transparent 25%)',
    'linear-gradient(45deg, transparent 75%, #e6e8eb 75%)',
    'linear-gradient(-45deg, transparent 75%, #e6e8eb 75%)',
  ].join(', '),
  backgroundSize: '16px 16px',
  backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0',
  selectors: {
    '&::after': {
      content: "''",
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
  },
})

export const image = style({
  display: 'block',
  flex: 1,
  minHeight: 0,
  objectFit: 'contain',
  width: '100%',
  height: '100%',
  selectors: {
    '&[data-action="removed"]': {
      opacity: 0.45,
    },
  },
})

export const hotspotDiff = style({})

globalStyle(`.${hotspotDiff} svg`, {
  display: 'block',
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
})
