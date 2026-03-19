import {createVar, style} from '@vanilla-extract/css'

export const radiusVar = createVar()

export const roundedCard = style({
  borderRadius: radiusVar,
})

export const changeSegment = style({
  selectors: {
    '&&:not([hidden])': {
      display: 'inline',
      lineHeight: 'calc(1.25em + 2px)',
    },
    '&&:hover': {
      backgroundColor: 'transparent',
      backgroundImage: `linear-gradient(
        to bottom,
        var(--card-bg-color) 0,
        var(--card-bg-color) 33.333%,
        currentColor 33.333%,
        currentColor 100%
      )`,
      backgroundSize: '1px 3px',
      backgroundRepeat: 'repeat-x',
      backgroundPositionY: 'bottom',
      paddingBottom: '3px',
      boxShadow: '0 0 0 1px var(--card-bg-color)',
      zIndex: 1,
    },
  },
})
