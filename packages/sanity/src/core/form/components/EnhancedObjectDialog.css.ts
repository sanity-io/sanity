import {css} from '#styled-system/css'

/**
 * Non-top nested dialogs stay in the DOM but are hidden from view. The class lands on the dialog
 * root (`[data-ui='Dialog']`) through the `Dialog` wrapper's `className` prop, exactly where the
 * original `styled(Dialog)` class used to go.
 *
 * A dialog is only hidden while the stack holds nested dialogs, which also turns the dialog's open
 * animation off (`animate`), so these declarations never compete with its animated `opacity` and
 * `transform`.
 */
export const hiddenDialog = css({
  /* Hide the backdrop (the semi-transparent overlay); `&&` beats the dialog's own (0,1,0) one */
  '&&': {
    background: 'transparent',
  },
  /* Hide the dialog card */
  "& [data-ui='DialogCard']": {
    opacity: 0,
    pointerEvents: 'none',
    transform: 'scale(0.95)',
  },
})
