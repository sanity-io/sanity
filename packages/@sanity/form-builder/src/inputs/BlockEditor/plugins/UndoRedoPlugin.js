// @flow
import Hotkeys from 'slate-hotkeys'
import {List} from 'immutable'
import {uniq} from 'lodash'
import type {SlateEditor, SlateOperation, UndoRedoStack, UndoRedoStackItem} from '../typeDefs'
import isWritingTextOperationsOnly from '../utils/isWritingTextOperation'
import {PathUtils, Operation} from 'slate'

type Options = {
  stack: UndoRedoStack
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

function recalculateOperations(item: UndoRedoStackItem) {
  const recalculatedOperations = []
  // Run through all the remote operations and check for remove_node, insert_node, move_node
  item.operations.forEach(itemOp => {
    let checkedOp = itemOp
    const pIndex = 0
    // console.log('Checking', checkedOp.toJSON())
    item.remoteOperations.forEach(remoteOp => {
      if (!checkedOp || !checkedOp.path) {
        return
      }
      const pAbove = remoteOp.path.get(0) < checkedOp.path.get(0)
      const pEqual = remoteOp.path.get(0) == checkedOp.path.get(0)
      switch (remoteOp.type) {
        case 'insert_node':
          // if the insert node is above this operations path, we need to increment the path
          if (pAbove || pEqual) {
            const newPath = PathUtils.increment(checkedOp.path, 1, pIndex)
            checkedOp = Operation.create({...checkedOp.toJS(), path: newPath})
          }
          break
        case 'remove_node':
          // if the remove node is above this operations path, we need to decrement the path
          if (pAbove) {
            const newPath = PathUtils.decrement(checkedOp.path, 1, pIndex)
            checkedOp = Operation.create({...checkedOp.toJS(), path: newPath})
          }
          // if the remove node is the same, remove the operation
          if (pEqual) {
            checkedOp = null
          }
          break
        default:
        // Nothing
      }
    })
    if (checkedOp) {
      recalculatedOperations.push(checkedOp)
    }
  })
  return List(recalculatedOperations)
}

function moveCursorUndo(editor: SlateEditor, item: UndoRedoStackItem) {
  if (item.beforeSelection) {
    editor.select(item.beforeSelection).focus()
    return editor
  }
  const lastOperationWithPath = editor.operations.findLastEntry(op => op.path !== undefined)
  if (lastOperationWithPath) {
    const path = lastOperationWithPath[1].path
    if (path.size === 1) {
      editor.moveToEndOfBlock()
    } else {
      editor.moveTo(lastOperationWithPath[1].path).moveToEndOfText()
    }
  }
  return editor
}

function moveCursorRedo(editor: SlateEditor, item: UndoRedoStackItem) {
  if (item.afterSelection) {
    editor.select(item.afterSelection).focus()
    return editor
  }
  const lastOperationWithPath = editor.operations.findLastEntry(op => op.path !== undefined)
  if (lastOperationWithPath) {
    const path = lastOperationWithPath[1].path
    if (path.size === 1) {
      editor.moveToEndOfBlock()
    } else {
      editor.moveTo(lastOperationWithPath[1].path).moveToEndOfText()
    }
  }
  return editor
}

// This plugin handles our own undo redo (disables Slate built in handling)

export default function UndoRedoPlugin(options: Options) {
  const {stack} = options

  function handleUndoItem(editor: SlateEditor, item, _operations) {
    if (!item) {
      return editor.focus()
    }
    let operations = List(_operations || [])
    const undoOperations =
      item.remoteOperations.size === 0 ? item.operations : recalculateOperations(item)
    operations = operations.concat(undoOperations.reverse().map(op => op.invert()))
    if (operations.size > 0) {
      const nextItem = stack.undo.slice(-1)[0]
      // Check if we should squash this undo step into the next
      if (nextItem && shouldSquashOperations(operations.concat(nextItem.operations))) {
        stack.redo.push(item)
        return handleUndoItem(editor, stack.undo.pop(), operations)
      }
      operations.forEach(op => {
        op.__isUndoRedo = 'undo'
        editor.applyOperation(op)
      })
      moveCursorUndo(editor, item)
      stack.redo.push(item)
      return editor
    }
    // If the undo step was invalidated do next step
    return handleUndoItem(editor, stack.undo.pop())
  }

  function handleRedoItem(editor: SlateEditor, item, _operations) {
    if (!item) {
      return editor.focus()
    }
    let operations = List(_operations || [])
    const redoOperations =
      item.remoteOperations.size === 0 ? item.operations : recalculateOperations(item)
    operations = operations.concat(redoOperations)
    if (operations.size > 0) {
      const nextItem = stack.redo.slice(-1)[0]
      // Check if we should squash this redo step into the next
      if (nextItem && shouldSquashOperations(operations.concat(nextItem.operations))) {
        stack.undo.push(item)
        return handleRedoItem(editor, stack.redo.pop(), operations)
      }
      operations.forEach(op => {
        op.__isUndoRedo = 'redo'
        editor.applyOperation(op)
      })
      moveCursorRedo(editor, item)
      stack.undo.push(item)
      return editor
    }
    // If the redo step was invalidated do next step
    return handleRedoItem(editor, stack.redo.pop())
  }

  return {
    onKeyDown(event: SyntheticKeyboardEvent<*>, editor: SlateEditor, next: void => void) {
      if (!(Hotkeys.isUndo(event) || Hotkeys.isRedo(event))) {
        return next()
      }
      if (Hotkeys.isUndo(event)) {
        return handleUndoItem(editor, stack.undo.pop())
      }
      if (Hotkeys.isRedo(event)) {
        return handleRedoItem(editor, stack.redo.pop())
      }
      return editor
    }
  }
}
