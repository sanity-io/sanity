// @flow

import type {SlateChange} from '../typeDefs'

import {Operation} from 'slate'

export default function createSelectionOperation(change: SlateChange) {
  const focusPath = change.value.focusKey
    ? change.value.document.getPath(change.value.focusKey)
    : undefined
  const anchorPath = change.value.anchorKey
    ? change.value.document.getPath(change.value.anchorKey)
    : undefined
  return Operation.create({
    type: 'set_selection',
    properties: {
      anchorPath,
      focusPath,
      focusOffset: change.value.selection.focusOffset,
      anchorOffset: change.value.selection.anchorOffset
    },
    value: change.value,
    selection: change.selection
  })
}
