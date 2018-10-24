// @flow

// This plugin does for now ensure that nothing can be dragged onto void nodes and cause errors.
// Slate doesn't check this by itself.
import {findNode} from 'slate-react'
import type {SlateChange} from '../typeDefs'

export default function OnDropPlugin() {
  return {
    onDrop(event: SyntheticMouseEvent<*>, change: SlateChange, next: void => void) {
      const {target} = event
      const node = findNode(target, change.editor)
      if (change.editor.query('isVoid', node)) {
        return change
      }
      return next()
    }
  }
}
