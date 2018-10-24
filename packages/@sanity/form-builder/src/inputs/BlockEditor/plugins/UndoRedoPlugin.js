// @flow
import Hotkeys from 'slate-hotkeys'
import {List} from 'immutable'
import {flatten, isEqual, uniq} from 'lodash'
import {editorValueToBlocks} from '@sanity/block-tools'
import type {
  FormBuilderValue,
  Patch,
  SlateChange,
  SlateValue,
  SlateOperation,
  Type,
  UndoRedoStack,
  UndoRedoStackItem
} from '../typeDefs'
import isWritingTextOperationsOnly from '../utils/isWritingTextOperation'

type Options = {
  stack: UndoRedoStack,
  blockContentType: Type,
  editorSchema: any,
  onChange: SlateChange => SlateChange,
  patchesToChange: (patches: Patch[], editorValue: SlateValue, snapshot: ?any) => SlateChange,
  changeToPatches: (
    unchangedEditorValue: SlateValue,
    change: SlateChange,
    value: ?(FormBuilderValue[])
  ) => Patch[]
}

const VALUE_TO_JSON_OPTS = {
  preserveData: true,
  preserveKeys: true,
  preserveSelection: false,
  preserveHistory: false
}

const SEND_PATCHES_TOKEN_CHARS = [' ', '\n']

function isTokenChar(operation: SlateOperation) {
  const text = operation.text
  return text && SEND_PATCHES_TOKEN_CHARS.includes(text)
}

function shouldSquashOperations(operations: List<SlateOperation>) {
  const operationsPaths = uniq(
    operations
      .map(op => (op.path ? JSON.stringify(op.path.toJSON()) : null))
      .toArray()
      .filter(Boolean)
  )
  if (operationsPaths.length !== 1) {
    return false
  }
  return isWritingTextOperationsOnly(operations) && !isTokenChar(operations.last())
}

function moveCursorUndo(change: SlateChange, item: UndoRedoStackItem) {
  if (item.beforeChangeEditorValue.selection) {
    change.select(item.beforeChangeEditorValue.selection).focus()
    return change
  }
  const lastOperationWithPath = change.operations.findLastEntry(op => op.path !== undefined)
  if (lastOperationWithPath) {
    const path = lastOperationWithPath[1].path
    if (path.size === 1) {
      change.moveToEndOfBlock()
    } else {
      change.moveTo(lastOperationWithPath[1].path).moveToEndOfText()
    }
  }
  return change
}

function moveCursorRedo(change: SlateChange, item: UndoRedoStackItem) {
  if (item.beforeChangeEditorValue.selection) {
    change.select(item.change.value.selection).focus()
    return change
  }
  const lastOperationWithPath = change.operations.findLastEntry(op => op.path !== undefined)
  if (lastOperationWithPath) {
    const path = lastOperationWithPath[1].path
    if (path.size === 1) {
      change.moveToEndOfBlock()
    } else {
      change.moveTo(lastOperationWithPath[1].path).moveToEndOfText()
    }
  }
  return change
}

// This plugin handles our own undo redo (disables Slate built in handling)

export default function UndoRedoPlugin(options: Options) {
  const {blockContentType, changeToPatches, patchesToChange, stack} = options

  function handleUndoWithRemoteChanges(
    change: SlateChange,
    item: UndoRedoStackItem,
    currentSnapshot: FormBuilderValue[]
  ) {
    const operations = List([])
    let inversedItemPatches = []
    const undoSnapshot = editorValueToBlocks(
      item.change.value.toJSON(VALUE_TO_JSON_OPTS),
      blockContentType
    )
    const undoRedoChange = patchesToChange([], item.change.value, item.snapshot)
    const invertedOperations = item.change.operations.reverse().map(op => op.invert())
    try {
      undoRedoChange.applyOperations(invertedOperations)
      inversedItemPatches = changeToPatches(item.change.value, undoRedoChange, undoSnapshot)
    } catch (err) {
      // console.log('Could not create inversed undo patches', err)
    }
    // If we got any remote patches setting the same block
    // then skip those inverted patches
    const toRemoveIndexes = []
    const remotePatches = flatten(item.remoteChanges.map(remoteChange => remoteChange.patches))
    inversedItemPatches = inversedItemPatches.map(patch => {
      const remotePatch = remotePatches
        .slice()
        .reverse()
        .find(
          rPatch =>
            rPatch.type === 'set' && patch.type === 'set' && isEqual(rPatch.path, patch.path)
        )
      if (remotePatch) {
        // We must remove any reversed patches unsetting this block
        const unsetPatchIndex = inversedItemPatches.findIndex(iPatch => {
          return iPatch.type === 'unset' && isEqual(iPatch.path, remotePatch.path)
        })
        if (unsetPatchIndex !== -1) {
          // console.log('Got unset patches')
          toRemoveIndexes.push(unsetPatchIndex)
        }
        return remotePatch
      }
      return patch
    })
    toRemoveIndexes.forEach(index => {
      inversedItemPatches.splice(index, 1)
    })
    try {
      const undoChange = patchesToChange(inversedItemPatches, change.value, currentSnapshot)
      if (isEqual(undoChange.value.document.toJSON(), change.value.document.toJSON())) {
        // console.log('isEqual')
        return operations
      }
      return undoChange.operations
    } catch (err) {
      // console.log('Could not apply undostep', err)
    }
    return operations
  }

  function handleRedoWithRemoteChanges(change: SlateChange, item: UndoRedoStackItem) {
    let itemPatches = []
    const operations = List([])
    const redoSnapshot = editorValueToBlocks(
      item.change.value.toJSON(VALUE_TO_JSON_OPTS),
      blockContentType
    )
    const undoRedoChange = patchesToChange([], item.beforeChangeEditorValue, item.snapshot)
    try {
      undoRedoChange.applyOperations(item.change.operations)
      itemPatches = changeToPatches(item.beforeChangeEditorValue, undoRedoChange, redoSnapshot)
    } catch (err) {
      // console.log('Could not create redo patches', err)
    }

    // If we got any remote patches setting the same block
    // then skip those inverted patches
    const toRemoveIndexes = []
    const remotePatches = flatten(item.remoteChanges.map(remoteChange => remoteChange.patches))
    itemPatches = itemPatches.map(patch => {
      const remotePatch = remotePatches
        .slice()
        .reverse()
        .find(
          rPatch =>
            rPatch.type === 'set' && patch.type === 'set' && isEqual(rPatch.path, patch.path)
        )
      if (remotePatch) {
        // We must remove any reversed patches inserting this block
        const insertPatchIndex = itemPatches.findIndex(iPatch => {
          return (
            iPatch.type === 'insert' &&
            remotePatches.find(
              rPatch =>
                rPatch.type === 'set' &&
                iPatch.items.map(pItem => pItem._key).includes(rPatch.path[0]._key) // eslint-disable-line max-nested-callbacks
            )
          )
        })
        if (insertPatchIndex !== -1) {
          // console.log('Got insert patches')
          toRemoveIndexes.push(insertPatchIndex)
        }
        return remotePatch
      }
      return patch
    })
    toRemoveIndexes.forEach(index => {
      itemPatches.splice(index, 1)
    })

    try {
      const redoChange = patchesToChange(
        itemPatches,
        change.value,
        editorValueToBlocks(change.value, blockContentType)
      )
      if (isEqual(redoChange.value.document.toJSON(), change.value.document.toJSON())) {
        // console.log('isEqual')
        return operations
      }
      return redoChange.operations
    } catch (err) {
      // console.log('Could not apply redostep', err)
    }
    return operations
  }

  function handleUndoItem(change, item, currentSnapshot, _operations) {
    if (!item) {
      return change.focus()
    }
    let operations = List(_operations || [])
    if (item.remoteChanges.length === 0) {
      operations = operations.concat(item.change.operations.reverse().map(op => op.invert()))
    } else {
      operations = operations.concat(handleUndoWithRemoteChanges(change, item, currentSnapshot))
    }
    if (operations.size > 0) {
      const nextItem = stack.undo.slice(-1)[0]
      // Check if we should squash this undo step into the next
      if (nextItem && shouldSquashOperations(operations.concat(nextItem.change.operations))) {
        stack.redo.push(item)
        return handleUndoItem(change, stack.undo.pop(), currentSnapshot, operations)
      }
      change.applyOperations(operations)
      moveCursorUndo(change, item)
      stack.redo.push(item)
      change.__isUndoRedo = 'undo'
      return change
    }
    // If the undo step was invalidated do next step
    return handleUndoItem(change, stack.undo.pop(), currentSnapshot)
  }

  function handleRedoItem(change, item, _operations) {
    if (!item) {
      return change.focus()
    }
    let operations = List(_operations || [])
    if (item.remoteChanges.length === 0) {
      operations = operations.concat(item.change.operations)
    } else {
      operations = operations.concat(handleRedoWithRemoteChanges(change, item))
    }
    if (operations.size > 0) {
      const nextItem = stack.redo.slice(-1)[0]
      // Check if we should squash this redo step into the next
      if (nextItem && shouldSquashOperations(operations.concat(nextItem.change.operations))) {
        stack.undo.push(item)
        return handleRedoItem(change, stack.redo.pop(), operations)
      }
      change.applyOperations(operations)
      moveCursorRedo(change, item)
      stack.undo.push(item)
      change.__isUndoRedo = 'redo'
      return change
    }
    // If the redo step was invalidated do next step
    return handleRedoItem(change, stack.redo.pop())
  }

  return {
    onKeyDown(event: SyntheticKeyboardEvent<*>, change: SlateChange, next: void => void) {
      if (!(Hotkeys.isUndo(event) || Hotkeys.isRedo(event))) {
        return next()
      }
      if (Hotkeys.isUndo(event)) {
        const currentSnapshot = editorValueToBlocks(
          change.value.toJSON(VALUE_TO_JSON_OPTS),
          blockContentType
        )
        return handleUndoItem(change, stack.undo.pop(), currentSnapshot)
      }
      if (Hotkeys.isRedo(event)) {
        return handleRedoItem(change, stack.redo.pop())
      }
      return change
    }
  }
}
