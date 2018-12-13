// @flow

// This plugin does for now ensure that nothing can be dragged onto void nodes and cause errors.
// Slate doesn't check this by itself.

import type {SlateEditor} from '../typeDefs'
import {findNode} from 'slate-react'

export default function OnDropPlugin() {
  return {
    onDrop(event: SyntheticMouseEvent<*>, editor: SlateEditor, next: void => void) {
      const {target} = event
      const node = findNode(target, editor)
      if (editor.query('isVoid', node)) {
        return editor
      }
      return next()
    }
  }
}
