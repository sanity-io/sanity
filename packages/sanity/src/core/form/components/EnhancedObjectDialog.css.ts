import {globalStyle, style} from '@vanilla-extract/css'

/**
 * Non-top nested dialogs stay in the DOM but are hidden from view. The class lands on the dialog
 * root (`[data-ui='Dialog']`) through the `Dialog` wrapper's `className` prop, exactly where the
 * original `styled(Dialog)` class used to go.
 *
 * The `!important` declarations are carried over from the original rule: they have to beat the
 * dialog's open animation (`fadeIn`/`zoomIn` animate `opacity` and `transform`).
 */
export const hiddenDialog = style({
  /* Hide the backdrop (the semi-transparent overlay) */
  background: 'transparent !important',
})

/* Hide the dialog card */
globalStyle(`${hiddenDialog} [data-ui='DialogCard']`, {
  opacity: '0 !important',
  // csstype types `pointer-events` as a closed keyword set, so the original `!important` cannot be
  // expressed here. Nothing in @sanity/ui declares `pointer-events` on the dialog card (the open
  // animation only touches opacity/transform), so the plain declaration resolves the same way.
  pointerEvents: 'none',
  transform: 'scale(0.95) !important',
})
