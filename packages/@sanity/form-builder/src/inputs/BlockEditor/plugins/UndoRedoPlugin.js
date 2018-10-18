// @flow
import Hotkeys from 'slate-hotkeys'
import {Value} from 'slate'
import {flatten, isEqual} from 'lodash'
import {editorValueToBlocks} from '@sanity/block-tools'
import {applyAll} from '../../../simplePatch'
import type {
  FormBuilderValue,
  Patch,
  SlateChange,
  SlateValue,
  Type,
  UndoRedoStack,
  UndoRedoStackItem
} from '../typeDefs'
import createEditorController from '../utils/createEditorController'
// import createSelectionOperation from '../utils/createSelectionOperation'
import SplitNodePlugin from './SplitNodePlugin'

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

// This plugin handles our own undo redo (disables Slate built in handling)

export default function UndoRedoPlugin(options: Options) {
  const {blockContentType, changeToPatches, editorSchema, patchesToChange, stack} = options
  const controllerOpts = {
    value: Value.fromJSON({}),
    plugins: [
      {
        schema: editorSchema
      },
      SplitNodePlugin()
    ]
  }
  const undoRedoController = createEditorController(controllerOpts)

  function handleUndoWithoutRemoteChanges(change: SlateChange, item: UndoRedoStackItem) {
    undoRedoController.setValue(item.change.value)
    undoRedoController.change(undoRedoChange => {
      undoRedoChange.withoutSaving(() => {
        undoRedoChange.withoutNormalizing(() => {
          undoRedoChange.applyOperations(
            // eslint-disable-next-line max-nested-callbacks
            item.change.operations.reverse().map(op => op.invert())
          )
        })
      })
      change.applyOperations(undoRedoChange.operations)
    })
  }

  function handleUndoWithRemoteChanges(change: SlateChange, item: UndoRedoStackItem) {
    let inversedItemPatches = []
    const undoSnapshot = editorValueToBlocks(
      item.change.value.toJSON(VALUE_TO_JSON_OPTS),
      blockContentType
    )
    const undoRedoChange = patchesToChange([], item.change.value, item.snapshot)
    const invertedOperations = item.change.operations.reverse().map(op => op.invert())
    undoRedoChange.withoutNormalizing(() => {
      invertedOperations.forEach(op => {
        try {
          undoRedoChange.applyOperations([op])
        } catch (err) {
          console.log('Could not apply undo operation', op.toJSON(), err)
        }
      })
      try {
        inversedItemPatches = changeToPatches(item.change.value, undoRedoChange, undoSnapshot)
      } catch (err) {
        console.log('Could not create inversed undo patches', err)
      }
    })

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
          console.log('Got unset patches')
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
      const undoChange = patchesToChange(
        inversedItemPatches,
        change.value,
        editorValueToBlocks(change.value, blockContentType)
      )
      change.applyOperations(undoChange.operations)
    } catch (err) {
      console.log('Could not apply undostep', err)
    }
  }

  function handleRedoWithRemoteChanges(change: SlateChange, item: UndoRedoStackItem) {
    let itemPatches = []
    const redoSnapshot = editorValueToBlocks(
      item.change.value.toJSON(VALUE_TO_JSON_OPTS),
      blockContentType
    )
    const undoRedoChange = patchesToChange([], item.beforeChangeEditorValue, item.snapshot)
    undoRedoChange.withoutNormalizing(() => {
      item.change.operations.forEach(op => {
        try {
          undoRedoChange.applyOperations([op])
        } catch (err) {
          console.log('Could not apply redo operation', op.toJSON(), err)
        }
      })
      try {
        itemPatches = changeToPatches(item.beforeChangeEditorValue, undoRedoChange, redoSnapshot)
      } catch (err) {
        console.log('Could not create redo patches', err)
      }
    })

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
                iPatch.items.map(pItem => pItem._key).includes(rPatch.path[0]._key)
            )
          )
        })
        if (insertPatchIndex !== -1) {
          console.log('Got insert patches')
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
      const undoChange = patchesToChange(
        itemPatches,
        change.value,
        editorValueToBlocks(change.value, blockContentType)
      )
      change.applyOperations(undoChange.operations)
    } catch (err) {
      console.log('Could not apply redostep', err)
    }
  }

  return {
    onKeyDown(event: SyntheticKeyboardEvent<*>, change: SlateChange, next: void => void) {
      if (!(Hotkeys.isUndo(event) || Hotkeys.isRedo(event))) {
        return next()
      }
      let item

      // Undo
      if (Hotkeys.isUndo(event) && (item = stack.undo.pop())) {
        // If there are no remote changes, we could just do a simple undo
        if (item.remoteChanges.length === 0) {
          handleUndoWithoutRemoteChanges(change, item)
        } else {
          handleUndoWithRemoteChanges(change, item)
        }
        console.log(change.operations.toJSON())
        if (change.operations.size > 0) {
          stack.redo.push(item)
          change.__isUndoRedo = 'undo'
          return change
        }
      }

      // Redo (pretty much as undo, just that we don't need to reverse any operations)
      if (Hotkeys.isRedo(event) && (item = stack.redo.pop())) {
        if (item.remoteChanges.length === 0) {
          change.applyOperations(item.change.operations)
        } else {
          handleRedoWithRemoteChanges(change, item)
        }
        if (change.operations.size > 0) {
          stack.undo.push(item)
          change.__isUndoRedo = 'redo'
          return change
        }
      }
      return change
    }
  }
}
