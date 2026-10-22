import {css, firstThatWorks} from '#styled-system/css'

/** `space[3]`, set on the close button by `UpsellDialog`. */
export const space3Var = '--upsell-dialog-space-3'

/**
 * Absolute positioned button to close the dialog.
 *
 * Button sets `position`, `background-color`, `border-radius`, `color` and the `--card-*`
 * variables on its root at (0,1,0); `&&` outranks them regardless of sheet order, and still yields
 * to Button's own hover rule (0,3,0) like the original did.
 */
export const closeButton = css({
  /**
   * Stays at (0,1,0): Button's enabled rule `&:not([data-disabled='true'])` (0,2,0) outranked this
   * declaration in the original too, so raising it here would change the rendering.
   */
  'boxShadow': 'none',
  '&&': {
    'position': 'absolute',
    'top': `var(${space3Var})`,
    'right': `var(${space3Var})`,
    'zIndex': 20,
    'background': 'transparent',
    'borderRadius': '9999px',
    'color': '#ffffff',
    '--card-fg-color': '#ffffff',
  },
  /** The original nested `:hover` compiled to a descendant selector, so keep it that way. */
  '& :hover': {
    '--card-fg-color': '#ffffff',
  },
})

export const image = css({
  objectFit: 'cover',
  width: '100%',
  height: firstThatWorks('200px', '100%'),
})
