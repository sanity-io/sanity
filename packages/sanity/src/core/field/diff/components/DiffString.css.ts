import {createVar, style} from '@vanilla-extract/css'

/** `rem(radius[1])` */
export const radius1Var = createVar()

export const roundedCard = style({
  selectors: {
    // Rendered through `DiffCard as={RoundedCard}`, which sets its own border-radius on the same
    // element; `&&` keeps this rule winning without depending on stylesheet order.
    '&&': {
      borderRadius: radius1Var,
    },
  },
})

export const changeSegment = style({
  selectors: {
    '&:not([hidden])': {
      display: 'inline',
      lineHeight: 'calc(1.25em + 2px)',
    },
    '&:hover': {
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
