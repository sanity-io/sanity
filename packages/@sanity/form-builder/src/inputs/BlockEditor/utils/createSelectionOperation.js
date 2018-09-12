// @flow

import type {SlateChange} from '../typeDefs'

import {Operation} from 'slate'

export default function createSelectionOperation(change: SlateChange) {
  const focusPath =
    change.value.selection.focus && change.value.selection.focus.key
      ? change.value.document.getPath(change.value.selection.focus.key)
      : undefined
  const anchorPath =
    change.value.selection.anchor && change.value.selection.anchor.key
      ? change.value.document.getPath(change.value.selection.anchor.key)
      : undefined
  const props = {
    type: 'set_selection',
    value: change.value,
    selection: change.value.selection,
    properties: {
      anchor: {
        path: anchorPath ? anchorPath.toArray() : null,
        offset: change.value.selection.anchor.offset
      },
      focus: {
        path: focusPath ? focusPath.toArray() : null,
        offset: change.value.selection.focus.offset
      }
    }
  }
  return Operation.create(props)
}
