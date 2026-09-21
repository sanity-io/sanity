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
  // Preserve the original important declaration. The assertion works around csstype's closed
  // pointer-events keyword set without changing the emitted value.
  pointerEvents: 'none !important' as 'none',
  transform: 'scale(0.95) !important',
})
