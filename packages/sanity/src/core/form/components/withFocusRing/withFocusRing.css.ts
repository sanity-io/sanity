import {createVar, style} from '@vanilla-extract/css'

/** `rem(radius[$radius ?? 1])`, set with `assignInlineVars` by `withFocusRing`. */
export const radiusVar = createVar()
/** `focusRingBorderStyle(border)`, set with `assignInlineVars` by `withFocusRing`. */
export const borderBoxShadowVar = createVar()
/** `focusRingStyle({...})` for the focused state, set with `assignInlineVars` by `withFocusRing`. */
export const focusBoxShadowVar = createVar()

export const focusRing = style({
  vars: {
    '--card-focus-box-shadow': borderBoxShadowVar,
  },
  outline: 'none',
  selectors: {
    // `&&`: the wrapped Card sets `border-radius` (radius prop) and `box-shadow` (shadow prop) itself;
    // the styled(Card) override used to win those ties by injection order.
    '&&': {
      borderRadius: radiusVar,
      boxShadow: 'var(--card-focus-box-shadow)',
    },
    '&:focus': {
      vars: {
        '--card-focus-box-shadow': focusBoxShadowVar,
      },
    },
  },
})
