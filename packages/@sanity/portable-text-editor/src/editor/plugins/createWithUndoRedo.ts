/**
 * This plugin will make the editor support undo/redo on the local state only.
 * The undo/redo steps are rebased against incoming patches since the step occurred.
 */

import {isEqual, flatten} from 'lodash'
import {Descendant, Editor, Operation, Path, SelectionOperation, Transforms} from 'slate'
import {DIFF_DELETE, DIFF_EQUAL, DIFF_INSERT, parsePatch} from '@sanity/diff-match-patch'
import {ObjectSchemaType, PortableTextBlock} from '@sanity/types'
import type {Patch} from '../../types/patch'
import {PatchObservable, PortableTextSlateEditor} from '../../types/editor'
import {debugWithName} from '../../utils/debug'
import {fromSlateValue} from '../../utils/values'
import {removeAllDocumentSelectionRanges} from '../../utils/ranges'

const debug = debugWithName('plugin:withUndoRedo')
const debugVerbose = debug.enabled && false

const SAVING = new WeakMap<Editor, boolean | undefined>()
const REMOTE_PATCHES = new WeakMap<
  Editor,
  {
    patch: Patch
    time: Date
    snapshot: PortableTextBlock[] | undefined
    previousSnapshot: PortableTextBlock[] | undefined
  }[]
>()
const UNDO_STEP_LIMIT = 1000

const isSaving = (editor: Editor): boolean | undefined => {
  const state = SAVING.get(editor)
  return state === undefined ? true : state
}

export interface Options {
  patches$?: PatchObservable
  readOnly: boolean
  blockSchemaType: ObjectSchemaType
}

const getRemotePatches = (editor: Editor) => {
  if (!REMOTE_PATCHES.get(editor)) {
    REMOTE_PATCHES.set(editor, [])
  }
  return REMOTE_PATCHES.get(editor) || []
}

export function createWithUndoRedo(
  options: Options
): (editor: PortableTextSlateEditor) => PortableTextSlateEditor {
  const {readOnly, patches$, blockSchemaType} = options

  return (editor: PortableTextSlateEditor) => {
    let previousSnapshot: PortableTextBlock[] | undefined = fromSlateValue(
      editor.children,
      blockSchemaType.name
    )
    const remotePatches = getRemotePatches(editor)
    if (patches$) {
      editor.subscriptions.push(() => {
        debug('Subscribing to patches')
        const sub = patches$.subscribe(({patches, snapshot}) => {
          let reset = false
          patches.forEach((patch) => {
            if (!reset && patch.origin !== 'local' && remotePatches) {
              if (patch.type === 'unset' && patch.path.length === 0) {
                debug('Someone else cleared the content, resetting undo/redo history')
                editor.history = {undos: [], redos: []}
                remotePatches.splice(0, remotePatches.length)
                SAVING.set(editor, true)
                reset = true
                return
              }
              remotePatches.push({patch, time: new Date(), snapshot, previousSnapshot})
            }
          })
          previousSnapshot = snapshot
        })
        return () => {
          debug('Unsubscribing to patches')
          sub.unsubscribe()
        }
      })
    }
    editor.history = {undos: [], redos: []}
    const {apply} = editor
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
      const save = isSaving(editor)

      let merge = true
      if (save) {
        if (!step) {
          merge = false
        } else if (operations.length === 0) {
          merge = shouldMerge(op, lastOp) || overwrite
        }

        if (step && merge) {
          step.operations.push(op)
        } else {
          const newStep = {
            operations: [...(editor.selection === null ? [] : [createSelectOperation(editor)]), op],
            timestamp: new Date(),
          }
          undos.push(newStep)
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
          const otherPatches = remotePatches.filter((item) => item.time >= step.timestamp)
          let transformedOperations = step.operations
          otherPatches.forEach((item) => {
            transformedOperations = flatten(
              transformedOperations.map((op) =>
                transformOperation(editor, item.patch, op, item.snapshot, item.previousSnapshot)
              )
            )
          })
          removeAllDocumentSelectionRanges(!!editor.selection)
          try {
            Editor.withoutNormalizing(editor, () => {
              withoutSaving(editor, () => {
                transformedOperations
                  .map(Operation.inverse)
                  .reverse()
                  .forEach((op) => {
                    editor.apply(op)
                  })
              })
            })
            editor.normalize()
            editor.onChange()
          } catch (err) {
            debug('Could not perform undo step', err)
            remotePatches.splice(0, remotePatches.length)
            Transforms.deselect(editor)
            editor.history = {undos: [], redos: []}
            SAVING.set(editor, true)
            editor.onChange()
            return
          }
          editor.history.redos.push(step)
          editor.history.undos.pop()
        }
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
          const otherPatches = remotePatches.filter((item) => item.time >= step.timestamp)
          let transformedOperations = step.operations
          otherPatches.forEach((item) => {
            transformedOperations = flatten(
              transformedOperations.map((op) =>
                transformOperation(editor, item.patch, op, item.snapshot, item.previousSnapshot)
              )
            )
          })
          removeAllDocumentSelectionRanges(!!editor.selection)
          try {
            Editor.withoutNormalizing(editor, () => {
              withoutSaving(editor, () => {
                transformedOperations.forEach((op) => {
                  editor.apply(op)
                })
              })
            })
            editor.normalize()
            editor.onChange()
          } catch (err) {
            debug('Could not perform redo step', err)
            remotePatches.splice(0, remotePatches.length)
            Transforms.deselect(editor)
            editor.history = {undos: [], redos: []}
            SAVING.set(editor, true)
            editor.onChange()
            return
          }
          editor.history.undos.push(step)
          editor.history.redos.pop()
        }
      }
    }

    // Plugin return
    return editor
  }
}

/**
 * This will adjust the operation paths and offsets according to the
 * remote patches by other editors since the step operations was performed.
 */
function transformOperation(
  editor: PortableTextSlateEditor,
  patch: Patch,
  operation: Operation,
  snapshot: PortableTextBlock[] | undefined,
  previousSnapshot: PortableTextBlock[] | undefined
): Operation[] {
  if (debugVerbose) {
    debug(`Adjusting '${operation.type}' operation paths for '${patch.type}' patch`)
    debug(`Operation ${JSON.stringify(operation)}`)
    debug(`Patch ${JSON.stringify(patch)}`)
  }

  const transformedOperation = {...operation}

  if (patch.type === 'insert' && patch.path.length === 1) {
    const insertBlockIndex = (snapshot || []).findIndex((blk) =>
      isEqual({_key: blk._key}, patch.path[0])
    )
    debug(
      `Adjusting block path (+${patch.items.length}) for '${transformedOperation.type}' operation and patch '${patch.type}'`
    )
    return [adjustBlockPath(transformedOperation, patch.items.length, insertBlockIndex)]
  }

  if (patch.type === 'unset' && patch.path.length === 1) {
    const unsetBlockIndex = (previousSnapshot || []).findIndex((blk) =>
      isEqual({_key: blk._key}, patch.path[0])
    )
    // If this operation is targeting the same block that got removed, return empty
    if (
      'path' in transformedOperation &&
      Array.isArray(transformedOperation.path) &&
      transformedOperation.path[0] === unsetBlockIndex
    ) {
      debug('Skipping transformation that targeted removed block')
      return []
    }
    if (debugVerbose) {
      debug(`Selection ${JSON.stringify(editor.selection)}`)
      debug(
        `Adjusting block path (-1) for '${transformedOperation.type}' operation and patch '${patch.type}'`
      )
    }
    return [adjustBlockPath(transformedOperation, -1, unsetBlockIndex)]
  }

  // Someone reset the whole value
  if (patch.type === 'unset' && patch.path.length === 0) {
    debug(`Adjusting selection for unset everything patch and ${operation.type} operation`)
    return []
  }

  if (patch.type === 'diffMatchPatch') {
    const operationTargetBlock = findOperationTargetBlock(editor, transformedOperation)
    if (!operationTargetBlock || !isEqual({_key: operationTargetBlock._key}, patch.path[0])) {
      return [transformedOperation]
    }
    const diffPatches = parsePatch(patch.value)
    diffPatches.forEach((diffPatch) => {
      let adjustOffsetBy = 0
      let changedOffset = diffPatch.utf8Start1
      const {diffs} = diffPatch
      diffs.forEach((diff, index) => {
        const [diffType, text] = diff
        if (diffType === DIFF_INSERT) {
          adjustOffsetBy += text.length
          changedOffset += text.length
        } else if (diffType === DIFF_DELETE) {
          adjustOffsetBy -= text.length
          changedOffset -= text.length
        } else if (diffType === DIFF_EQUAL) {
          // Only up to the point where there are no other changes
          if (!diffs.slice(index).every(([dType]) => dType === DIFF_EQUAL)) {
            changedOffset += text.length
          }
        }
      })
      // Adjust accordingly if someone inserted text in the same node before us
      if (transformedOperation.type === 'insert_text') {
        if (changedOffset < transformedOperation.offset) {
          transformedOperation.offset += adjustOffsetBy
        }
      }
      // Adjust accordingly if someone removed text in the same node before us
      if (transformedOperation.type === 'remove_text') {
        if (changedOffset <= transformedOperation.offset - transformedOperation.text.length) {
          transformedOperation.offset += adjustOffsetBy
        }
      }
      // Adjust set_selection operation's points to new offset
      if (transformedOperation.type === 'set_selection') {
        const currentFocus = transformedOperation.properties?.focus
          ? {...transformedOperation.properties.focus}
          : undefined
        const currentAnchor = transformedOperation?.properties?.anchor
          ? {...transformedOperation.properties.anchor}
          : undefined
        const newFocus = transformedOperation?.newProperties?.focus
          ? {...transformedOperation.newProperties.focus}
          : undefined
        const newAnchor = transformedOperation?.newProperties?.anchor
          ? {...transformedOperation.newProperties.anchor}
          : undefined
        if ((currentFocus && currentAnchor) || (newFocus && newAnchor)) {
          const points = [currentFocus, currentAnchor, newFocus, newAnchor]
          points.forEach((point) => {
            if (point && changedOffset < point.offset) {
              point.offset += adjustOffsetBy
            }
          })
          if (currentFocus && currentAnchor) {
            transformedOperation.properties = {
              focus: currentFocus,
              anchor: currentAnchor,
            }
          }
          if (newFocus && newAnchor) {
            transformedOperation.newProperties = {
              focus: newFocus,
              anchor: newAnchor,
            }
          }
        }
      }
    })
    return [transformedOperation]
  }
  return [transformedOperation]
}
/**
 * Adjust the block path for a operation
 */
function adjustBlockPath(operation: Operation, level: number, blockIndex: number): Operation {
  const transformedOperation = {...operation}
  if (
    blockIndex >= 0 &&
    transformedOperation.type !== 'set_selection' &&
    Array.isArray(transformedOperation.path) &&
    transformedOperation.path[0] >= blockIndex + level &&
    transformedOperation.path[0] + level > -1
  ) {
    const newPath = [transformedOperation.path[0] + level, ...transformedOperation.path.slice(1)]
    transformedOperation.path = newPath
  }
  if (transformedOperation.type === 'set_selection') {
    const currentFocus = transformedOperation.properties?.focus
      ? {...transformedOperation.properties.focus}
      : undefined
    const currentAnchor = transformedOperation?.properties?.anchor
      ? {...transformedOperation.properties.anchor}
      : undefined
    const newFocus = transformedOperation?.newProperties?.focus
      ? {...transformedOperation.newProperties.focus}
      : undefined
    const newAnchor = transformedOperation?.newProperties?.anchor
      ? {...transformedOperation.newProperties.anchor}
      : undefined
    if ((currentFocus && currentAnchor) || (newFocus && newAnchor)) {
      const points = [currentFocus, currentAnchor, newFocus, newAnchor]
      points.forEach((point) => {
        if (point && point.path[0] >= blockIndex + level && point.path[0] + level > -1) {
          point.path = [point.path[0] + level, ...point.path.slice(1)]
        }
      })
      if (currentFocus && currentAnchor) {
        transformedOperation.properties = {
          focus: currentFocus,
          anchor: currentAnchor,
        }
      }
      if (newFocus && newAnchor) {
        transformedOperation.newProperties = {
          focus: newFocus,
          anchor: newAnchor,
        }
      }
    }
  }
  //   // Assign fresh point objects (we don't want to mutate the original ones)
  return transformedOperation
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

function findOperationTargetBlock(
  editor: PortableTextSlateEditor,
  operation: Operation
): Descendant | undefined {
  let block: Descendant | undefined
  if (operation.type === 'set_selection' && editor.selection) {
    block = editor.children[editor.selection.focus.path[0]]
  } else if ('path' in operation) {
    block = editor.children[operation.path[0]]
  }
  return block
}
