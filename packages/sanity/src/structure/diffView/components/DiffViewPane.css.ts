import {css} from '#styled-system/css'

/**
 * A side of the comparison view is for reading. The form is read-only, which disables its
 * controls but still draws them; here they go, so a side shows content only. Text stays
 * selectable, references still open in a new tab, and collapsed items still open to be read.
 */
export const readOnlyPane = css({
  // Disabled controls: array Add item and drag handles, item and field menus, the text toolbar
  '& button[data-disabled="true"]': {
    display: 'none',
  },
  // Portable Text's full-screen editor is still enabled when read-only
  '& [data-testid="fullscreen-button-expand"]': {
    display: 'none',
  },
  // The text area sets resize on its own [data-as] attribute, so this matches it too to win
  '& textarea, & textarea[data-as="textarea"]': {
    resize: 'none',
  },
})
