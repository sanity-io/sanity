import {css} from '#styled-system/css'

const LOGO_MARK_SIZE = 25 // width and height, px

/** `rem(theme.radius[RADIUS])`, set by the component */
export const radiusVar = '--home-button-radius'
/** `focusRingStyle(...)` computed from the theme, set by the component */
export const focusRingBoxShadowVar = '--home-button-focus-ring-box-shadow'

export const logoMarkContainer = css({
  height: `${LOGO_MARK_SIZE}px`,
  width: `${LOGO_MARK_SIZE}px`,
})

export const homeButtonCard = css({
  // Kept verbatim at single-class specificity: Box's own `&:not([hidden]) { display: block }`
  // (0,2,0) outranked this declaration in the original too, so the card renders as a block.
  'display': 'flex',
  // Card's own `&[data-as='a']` rule sets the same two values.
  'outline': 'none',
  'textDecoration': 'none',
  // `&&` beats Card's own `border-radius` (its `radius` prop defaults to 0).
  '&&': {
    borderRadius: `var(${radiusVar})`,
  },
  // Card's `&[data-as='a'] { box-shadow: var(--card-focus-ring-box-shadow) }` is (0,2,0);
  // the original `&:focus-visible` (0,2,0) only won by injection order.
  '&&:focus-visible': {
    boxShadow: `var(${focusRingBoxShadowVar})`,
  },
})
