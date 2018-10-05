// @flow
import Hotkeys from 'slate-hotkeys'
import type {Type, UndoRedoStack, SlateChange} from '../typeDefs'
import patchesToChange from '../utils/patchesToChange'
import createSelectionOperation from '../utils/createSelectionOperation'

type Options = {
  stack: UndoRedoStack,
  onChange: SlateChange => SlateChange,
  blockContentType: Type
}

// This plugin handles our own undo redo (disables Slate built in handling)

export default function UndoRedoPlugin(options: Options) {
  const {stack, blockContentType, onChange} = options
  return {
    // eslint-disable-next-line complexity
    onKeyDown(event: SyntheticKeyboardEvent<*>, change: SlateChange) {
      if (Hotkeys.isUndo(event) || Hotkeys.isRedo(event)) {
        let item
        // Undo
        if (Hotkeys.isUndo(event) && (item = stack.undo.pop())) {
          const {inversedPatches, editorValue} = item
          // onPatch(PatchEvent.from(inversedPatches.concat(set({}, [{_key: 'undoRedoVoidPatch'}]))))
          // Create Slate change for these patches
          const patchChange = patchesToChange(inversedPatches, change.value, null, blockContentType)
          patchChange.applyOperations([createSelectionOperation(editorValue.change())]).focus()
          // Tag the change, so that changeToPatches know's it's a undoRedo change.
          patchChange.__isUndoRedo = 'undo'
          stack.redo.push(item)
          onChange(patchChange)
        }
        // Redo (pretty much as undo, just that we don't need to reverse any operations)
        if (Hotkeys.isRedo(event) && (item = stack.redo.pop())) {
          const {patches} = item
          const patchChange = patchesToChange(patches, change.value, null, blockContentType)
          // Restore the selection
          patchChange.applyOperations([createSelectionOperation(item.change)]).focus()
          patchChange.__isUndoRedo = 'redo'
          stack.undo.push(item)
          onChange(patchChange)
        }
        return change
      }
      return undefined
    }
  }
}
