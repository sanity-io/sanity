import {css} from '#styled-system/css'

/** `rem(radius[$radius ?? 1])`, set inline by `withFocusRing`. */
export const radiusVar = '--with-focus-ring-radius'
/** `focusRingBorderStyle(border)`, set inline by `withFocusRing`. */
export const borderBoxShadowVar = '--with-focus-ring-border-box-shadow'
/** `focusRingStyle({...})` for the focused state, set inline by `withFocusRing`. */
export const focusBoxShadowVar = '--with-focus-ring-focus-box-shadow'

export const focusRing = css({
  '--card-focus-box-shadow': `var(${borderBoxShadowVar})`,
  'outline': 'none',
  // `&&`: the wrapped Card sets `border-radius` (radius prop) and `box-shadow` (shadow prop) itself;
  // the styled(Card) override used to win those ties by injection order.
  '&&': {
    borderRadius: `var(${radiusVar})`,
    boxShadow: 'var(--card-focus-box-shadow)',
  },
  '&:focus': {
    '--card-focus-box-shadow': `var(${focusBoxShadowVar})`,
  },
})
