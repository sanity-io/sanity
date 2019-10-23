// This plugin runs when the editor receives focus
// Ensures that an empty block is inserted when the editor gets focus and it's empty.

// It also prevents default onFocus actions in slate-react being triggered as we
// abort the plugin chain. The version of slate-react we are currently using (0.21.16)
// has a terrible scrolling bug which will be prevented by canceling the plugin chain here.

// TODO: remove this and continue once we have upgraded slate-react
// (where the bug is fixed - see https://github.com/ianstormtaylor/slate/commit/d28f78c0607ad147f85ff4a363fa65d7ddfa7c8c)

import {SlateEditor} from '../typeDefs'

export default function OnFocusPlugin() {
  return {
    onFocus(event: any, editor: SlateEditor, next: (arg0: void) => void) {
      editor.command('ensurePlaceHolderBlock')
      editor.focus()
      // Cancel slate-react's 'after' plugin chain to prevent built in scrolling bug.
      return true
    }
  }
}
