// @flow

// This plugin runs when the editor receives focus
// Ensures that an empty block is inserted when the editor gets focus and it's empty.

import type {SlateEditor} from '../typeDefs'

export default function OnFocusPlugin() {
  return {
    onFocus(event: any, editor: SlateEditor, next: void => void) {
      editor.command('ensurePlaceHolderBlock')
      return next()
    }
  }
}
