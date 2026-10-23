import {css} from '#styled-system/css'

/** `rem(radius[2])` */
export const radius2Var = '--change-title-segment-radius-2'
/** `rem(space[1])` */
export const space1Var = '--change-title-segment-space-1'

export const roundedCard = css({
  'padding': `var(${space1Var})`,
  // Rendered through `DiffCard as={RoundedCard}`, whose own `&&` rule sets border-radius on the
  // same element; `&&&` outranks it without depending on stylesheet order.
  '&&&': {
    borderRadius: `var(${radius2Var})`,
  },
})

export const annotationText = css({
  '&:not([hidden])': {
    color: 'inherit',
  },
})
