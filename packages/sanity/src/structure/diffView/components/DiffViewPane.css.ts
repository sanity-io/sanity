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
  // The field marks say which fields differ; the change bar beside a field would open a history
  // this view does not have
  '& [data-testid="change-bar"]': {
    display: 'none',
  },
  // What differs from the Reference: added text in green and removed text in red, whoever made
  // the change and whatever release it is in. User colours leave out green and red, so these
  // never read as a person. Light and dark tints are Sanity's green and red 100/700 and 900/200.
  // The pane is a Card, which carries the scheme in data-scheme. `light-dark()` is not used: a
  // studio build down-levels it into variables nothing defines, and the colours drop out.
  '& ins': {
    backgroundColor: '#c5fce8',
    color: '#015133',
  },
  '& del': {
    backgroundColor: '#ffe7e5',
    color: '#8b2018',
  },
  '&[data-scheme="dark"] ins': {
    backgroundColor: '#06231a',
    color: '#a9f9dc',
  },
  '&[data-scheme="dark"] del': {
    backgroundColor: '#321615',
    color: '#ffdedc',
  },
})
