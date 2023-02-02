/* eslint-disable complexity */
/* eslint-disable no-eq-null */
/* eslint-disable max-depth */
/**
 * This plugin will make the editor support undo/redo on the local state only.
 * The undo/redo steps are rebased against incoming patches since the step occurred.
 */

import {isEqual, flatten} from 'lodash'
import {
  Editor,
  Element as SlateElement,
  Operation,
  Path,
  SplitNodeOperation,
  InsertTextOperation,
  RemoveTextOperation,
  SelectionOperation,
} from 'slate'
import * as DMP from 'diff-match-patch'
import type {Patch} from '../../types/patch'
import {PatchObservable, PortableTextSlateEditor} from '../../types/editor'
import {debugWithName} from '../../utils/debug'
import {isPatching} from '../../utils/withoutPatching'

const debug = debugWithName('plugin:withUndoRedo')
// eslint-disable-next-line new-cap
const dmp = new DMP.diff_match_patch()

const SAVING = new WeakMap<Editor, boolean | undefined>()
const MERGING = new WeakMap<Editor, boolean | undefined>()
const UNDO_STEP_LIMIT = 300

const isMerging = (editor: Editor): boolean | undefined => {
  return MERGING.get(editor)
}

const isSaving = (editor: Editor): boolean | undefined => {
  if (!isPatching(editor)) {
    return false
  }
  return SAVING.get(editor)
}

export interface Options {
  patches$?: PatchObservable
  readOnly: boolean
}

export function createWithUndoRedo(
  options: Options
): (editor: PortableTextSlateEditor) => PortableTextSlateEditor {
  const {readOnly, patches$} = options
  const remotePatches: {patch: Patch; time: Date}[] = []
  return (editor: PortableTextSlateEditor) => {
    if (patches$) {
      editor.subscriptions.push(() => {
        debug('Subscribing to patches')
        const sub = patches$.subscribe(({patches}) => {
          patches.forEach((patch) => {
            if (patch.origin !== 'local') {
              remotePatches.push({patch: patch, time: new Date()})
            }
          })
        })
        return () => {
          debug('Unsubscribing to patches')
          sub.unsubscribe()
        }
      })
    }
    editor.history = {undos: [], redos: []}
    const {apply} = editor
    // Apply function for merging and saving local history inspired from 'slate-history' by Ian Storm Taylor
    editor.apply = (op: Operation) => {
      if (readOnly) {
        apply(op)
        return
      }
      const {operations, history} = editor
      const {undos} = history
      const step = undos[undos.length - 1]
      const lastOp = step && step.operations && step.operations[step.operations.length - 1]
      const overwrite = shouldOverwrite(op, lastOp)
      let save = isSaving(editor)
      let merge = isMerging(editor)

      if (save == null) {
        save = shouldSave(op, lastOp)
      }

      if (save) {
        if (merge == null) {
          if (step == null) {
            merge = false
            // eslint-disable-next-line no-negated-condition
          } else if (operations.length !== 0) {
            merge = true
          } else {
            merge = shouldMerge(op, lastOp) || overwrite
          }
        }

        if (step && merge) {
          if (overwrite) {
            step.operations.pop()
          }
          step.operations.push(op)
        } else {
          const stp = {
            operations: [...(editor.selection === null ? [] : [createSelectOperation(editor)]), op],
            timestamp: new Date(),
          }
          undos.push(stp)
          debug('Created new undo step', step)
        }

        while (undos.length > UNDO_STEP_LIMIT) {
          undos.shift()
        }

        if (shouldClear(op)) {
          history.redos = []
        }
      }
      apply(op)
    }

    editor.undo = () => {
      if (readOnly) {
        return
      }
      const {undos} = editor.history
      if (undos.length > 0) {
        const step = undos[undos.length - 1]
        debug('Undoing', step)
        if (step.operations.length > 0) {
          const otherPatches = [...remotePatches.filter((item) => item.time >= step.timestamp)]
          let transformedOperations = step.operations
          otherPatches.forEach((item) => {
            transformedOperations = flatten(
              transformedOperations.map((op) => transformOperation(editor, item.patch, op))
            )
          })
          withoutSaving(editor, () => {
            Editor.withoutNormalizing(editor, () => {
              transformedOperations
                .map(Operation.inverse)
                .reverse()
                .forEach((op) => {
                  // Try this as the document could be changed from the outside,
                  // and sometimes we can't perform the undo operation on the current doc.
                  try {
                    editor.apply(op)
                  } catch (err) {
                    debug('Could not perform undo step', err)
                    editor.history.redos.push(step)
                    editor.history.undos.pop()
                  }
                })
            })
          })
        }
        editor.history.redos.push(step)
        editor.history.undos.pop()
        editor.onChange()
      }
    }

    editor.redo = () => {
      if (readOnly) {
        return
      }
      const {redos} = editor.history
      if (redos.length > 0) {
        const step = redos[redos.length - 1]
        debug('Redoing', step)
        if (step.operations.length > 0) {
          const otherPatches = remotePatches.filter((item) => item.time > step.timestamp)
          let transformedOperations = step.operations
          otherPatches.forEach((item) => {
            transformedOperations = flatten(
              transformedOperations.map((op) => transformOperation(editor, item.patch, op))
            )
          })
          withoutSaving(editor, () => {
            Editor.withoutNormalizing(editor, () => {
              transformedOperations.forEach((op) => {
                try {
                  editor.apply(op)
                } catch (err) {
                  debug('Could not perform redo step', err)
                  editor.history.undos.push(step)
                  editor.history.redos.pop()
                }
              })
            })
          })
        }
        editor.history.undos.push(step)
        editor.history.redos.pop()
        editor.onChange()
      }
    }

    // Plugin return
    return editor
  }
}

// This will adjust the user selection according to patcehes done by others.
// TODO: complete all necessary steps of the algorithm and write tests.

// eslint-disable-next-line max-statements
function transformOperation(editor: Editor, patch: Patch, operation: Operation): Operation[] {
  // debug(`Rebasing selection for patch ${patch.type} against operation ${operation.type}`)

  let transformedOperation = {...operation}

  if (patch.type === 'insert' && patch.path.length === 1) {
    return [adjustBlockPath(editor, patch, operation, patch.items.length)]
  }
  if (patch.type === 'unset' && patch.path.length === 1) {
    return [adjustBlockPath(editor, patch, operation, -1)]
  }

  // Someone reset the whole value
  if (patch.type === 'unset' && patch.path.length === 0) {
    debug(`Adjusting selection for unset everything patch and ${operation.type} operation`)
    return [operation]
  }

  if (patch.type === 'diffMatchPatch') {
    const blockIndex = editor.children.findIndex((blk) => isEqual({_key: blk._key}, patch.path[0]))
    const block = editor.children[blockIndex]
    if (SlateElement.isElement(block) && Array.isArray(block.children)) {
      const childIndex = block.children.findIndex((child) =>
        isEqual({_key: child._key}, patch.path[2])
      )
      const parsed = dmp.patch_fromText(patch.value)[0]
      if (!parsed) {
        debug('Could not parse diffMatchPatch', patch)
        return [operation]
      }
      const distance = parsed.length2 - parsed.length1
      const patchIsRemovingText = parsed.diffs.some((diff) => diff[0] === -1)

      if (operation.type === 'split_node' && operation.path.length > 1) {
        const splitOperation = transformedOperation as SplitNodeOperation
        if (patchIsRemovingText) {
          splitOperation.position -= distance
        } else {
          splitOperation.position += distance
        }
        return [splitOperation]
      }

      if (
        (operation.type === 'insert_text' || operation.type === 'remove_text') &&
        Path.isPath(operation.path) &&
        operation.path[0] !== undefined &&
        operation.path[0] === blockIndex &&
        operation.path[1] === childIndex
      ) {
        if (operation.type === 'insert_text') {
          let insertOffset = 0
          for (const diff of parsed.diffs) {
            if (diff[0] === 0) {
              insertOffset = diff[1].length
            }
            if (diff[0] === 1) {
              break
            }
          }
          if (parsed.start1 !== null && insertOffset + parsed.start1 <= operation.offset) {
            const insertTextOperation = transformedOperation as InsertTextOperation
            insertTextOperation.offset += distance
            transformedOperation = insertTextOperation
          }
          // TODO: deal with overlapping ranges
          return [transformedOperation]
        }

        if (operation.type === 'remove_text') {
          let insertOffset = 0
          for (const diff of parsed.diffs) {
            if (diff[0] === 0) {
              insertOffset = diff[1].length
            }
            if (diff[0] === -1) {
              break
            }
          }
          if (parsed.start1 !== null && insertOffset + parsed.start1 <= operation.offset) {
            const removeTextOperation = transformedOperation as RemoveTextOperation
            removeTextOperation.offset -= distance
            transformedOperation = removeTextOperation
          }
          return [transformedOperation]
        }
      }
      // // Selection operations with diffPatchMatch
      // if (operation.type === 'set_selection') {
      //   const newProperties = transformedOperation.newProperties
      //   if (newProperties && patchIsRemovingText) {
      //     newProperties.offset = newProperties.offset - distance
      //   } else if (newProperties) {
      //     newProperties.offset = newProperties.offset + distance
      //   }
      //   return [newProperties ? {...transformedOperation, newProperties} : transformedOperation]
      // }
    }
    // TODO: transform this?
    // if (operation.type === 'set_selection' && patch.type !== 'diffMatchPatch') {
    //   console.log('set_selection other', JSON.stringify(patch))
    // }
  }
  return [operation]
}

function adjustBlockPath(
  editor: Editor,
  patch: Patch,
  operation: Operation,
  level: number
): Operation {
  const myIndex = editor.children.findIndex((blk) => isEqual({_key: blk._key}, patch.path[0]))
  if (
    myIndex >= 0 &&
    operation.type !== 'set_selection' &&
    Array.isArray(operation.path) &&
    operation.path[0] !== undefined &&
    operation.path[0] >= myIndex + level
  ) {
    const transformedOperation = {...operation}
    const newPath = [operation.path[0] + level, ...operation.path.slice(1)]
    debug(`Adjusting ${operation.type} for block ${patch.type}`, operation.path, newPath)
    transformedOperation.path = newPath
    return transformedOperation
  }
  return operation
}

// Helper functions for editor.apply above

const shouldMerge = (op: Operation, prev: Operation | undefined): boolean => {
  if (op.type === 'set_selection') {
    return true
  }

  // Text input
  if (
    prev &&
    op.type === 'insert_text' &&
    prev.type === 'insert_text' &&
    op.offset === prev.offset + prev.text.length &&
    Path.equals(op.path, prev.path) &&
    op.text !== ' ' // Tokenize between words
  ) {
    return true
  }

  // Text deletion
  if (
    prev &&
    op.type === 'remove_text' &&
    prev.type === 'remove_text' &&
    op.offset + op.text.length === prev.offset &&
    Path.equals(op.path, prev.path)
  ) {
    return true
  }

  // Don't merge
  return false
}

const shouldSave = (op: Operation, prev: Operation | undefined): boolean => {
  if (op.type === 'set_selection' && op.newProperties === null) {
    return false
  }

  return true
}

const shouldOverwrite = (op: Operation, prev: Operation | undefined): boolean => {
  if (prev && op.type === 'set_selection' && prev.type === 'set_selection') {
    return true
  }

  return false
}

const shouldClear = (op: Operation): boolean => {
  if (op.type === 'set_selection') {
    return false
  }

  return true
}

export function withoutSaving(editor: Editor, fn: () => void): void {
  const prev = isSaving(editor)
  SAVING.set(editor, false)
  fn()
  SAVING.set(editor, prev)
}

function createSelectOperation(editor: Editor): SelectionOperation {
  return {
    type: 'set_selection',
    properties: {...editor.selection},
    newProperties: {...editor.selection},
  }
}
