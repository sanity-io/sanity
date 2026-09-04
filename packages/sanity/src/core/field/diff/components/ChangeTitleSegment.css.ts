import {createVar, style} from '@vanilla-extract/css'

/** `rem(radius[2])` */
export const radius2Var = createVar()
/** `rem(space[1])` */
export const space1Var = createVar()

export const roundedCard = style({
  padding: space1Var,
  selectors: {
    // Rendered through `DiffCard as={RoundedCard}`, which sets its own border-radius on the same
    // element; `&&` keeps this rule winning without depending on stylesheet order.
    '&&': {
      borderRadius: radius2Var,
    },
  },
})

export const annotationText = style({
  selectors: {
    '&:not([hidden])': {
      color: 'inherit',
    },
  },
})
