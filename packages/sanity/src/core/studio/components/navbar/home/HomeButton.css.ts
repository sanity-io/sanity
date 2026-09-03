import {createVar, style} from '@vanilla-extract/css'

const LOGO_MARK_SIZE = 25 // width and height, px

/** `rem(theme.radius[RADIUS])`, set by the component */
export const radiusVar = createVar()
/** `focusRingStyle(...)` computed from the theme, set by the component */
export const focusRingBoxShadowVar = createVar()

export const logoMarkContainer = style({
  height: `${LOGO_MARK_SIZE}px`,
  width: `${LOGO_MARK_SIZE}px`,
})

export const homeButtonCard = style({
  // Kept verbatim at single-class specificity: Box's own `&:not([hidden]) { display: block }`
  // (0,2,0) outranked this declaration in the original too, so the card renders as a block.
  display: 'flex',
  // Card's own `&[data-as='a']` rule sets the same two values.
  outline: 'none',
  textDecoration: 'none',
  selectors: {
    // `&&` beats Card's own `border-radius` (its `radius` prop defaults to 0).
    '&&': {
      borderRadius: radiusVar,
    },
    // Card's `&[data-as='a'] { box-shadow: var(--card-focus-ring-box-shadow) }` is (0,2,0);
    // the original `&:focus-visible` (0,2,0) only won by injection order.
    '&&:focus-visible': {
      boxShadow: focusRingBoxShadowVar,
    },
  },
})
