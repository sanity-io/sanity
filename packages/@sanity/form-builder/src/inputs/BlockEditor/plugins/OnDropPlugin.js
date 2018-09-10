// @flow

// This plugin does for now ensure that nothing can be dragged onto void nodes and cause errors.
// Slate doesn't check this by itself.
import type {SlateChange} from '../typeDefs'
import {findNode} from 'slate-react'

export default function OnDropPlugin() {
  return {
    onDrop(event: SyntheticMouseEvent<*>, change: SlateChange) {
      const {target} = event
      const {value} = change
      const node = findNode(target, value)
      if (node.isVoid) {
        return change
      }
      return undefined
    }
  }
}
