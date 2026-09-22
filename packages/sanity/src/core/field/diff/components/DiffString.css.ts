import {createVar, style} from '@vanilla-extract/css'

/** `rem(radius[1])` */
export const radius1Var = createVar()

export const roundedCard = style({
  selectors: {
    // Rendered through `DiffCard as={RoundedCard}`, whose own `&&` rule sets border-radius on the
    // same element; `&&&` outranks it without depending on stylesheet order.
    '&&&': {
      borderRadius: radius1Var,
    },
    // Card's own `&:not([hidden]) {display: block}` is (0,2,0). Previously `styled(Card)` with
    // `as={RoundedCard}` replaced Card so the span stayed inline; now Card forwards `as` and its
    // display:block lands on the same element.
    '&&:not([hidden])': {
      display: 'inline',
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
