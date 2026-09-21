import {white} from '@sanity/color'
import {createVar, globalStyle, style} from '@vanilla-extract/css'

/** `space[3]`, set on the close button by `UpsellDialog`. */
export const space3Var = createVar()

/**
 * Absolute positioned button to close the dialog.
 *
 * Button sets `position`, `background-color`, `border-radius`, `color` and the `--card-*`
 * variables on its root at (0,1,0); `&&` outranks them regardless of sheet order, and still yields
 * to Button's own hover rule (0,3,0) like the original did.
 */
export const closeButton = style({
  /**
   * Stays at (0,1,0): Button's enabled rule `&:not([data-disabled='true'])` (0,2,0) outranked this
   * declaration in the original too, so raising it here would change the rendering.
   */
  boxShadow: 'none',
  selectors: {
    '&&': {
      position: 'absolute',
      top: space3Var,
      right: space3Var,
      zIndex: 20,
      background: 'transparent',
      borderRadius: '9999px',
      color: white.hex,
      vars: {'--card-fg-color': white.hex},
    },
  },
})

/** The original nested `:hover` compiled to a descendant selector, so keep it that way. */
globalStyle(`${closeButton} :hover`, {
  vars: {'--card-fg-color': white.hex},
})

export const image = style({
  objectFit: 'cover',
  width: '100%',
  height: ['100%', '200px'],
})
