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
    onKeyDown(event: SyntheticKeyboardEvent<*>, change: SlateChange, next: void => void) {
      if (Hotkeys.isUndo(event) || Hotkeys.isRedo(event)) {
        let item
        // Undo
        if (Hotkeys.isUndo(event) && (item = stack.undo.pop())) {
          const {inversedPatches, editorValue, snapshot} = item
          let patchChange
          // Create Slate change for these inverted patches
          // eslint-disable-next-line max-depth
          try {
            patchChange = patchesToChange(inversedPatches, change.value, snapshot, blockContentType)
            patchChange.applyOperations([createSelectionOperation(editorValue.change())]).focus()
            // Tag the change, so that changeToPatches know's it's a undoRedo change.
            patchChange.__isUndoRedo = 'undo'
            stack.redo.push(item)
          } catch (err) {
            // eslint-disable-next-line no-console
            console.error('Could not apply redo step', item, err)
          }
          // eslint-disable-next-line max-depth
          if (patchChange) {
            onChange(patchChange)
          }
        }
        // Redo (pretty much as undo, just that we don't need to reverse any operations)
        if (Hotkeys.isRedo(event) && (item = stack.redo.pop())) {
          const {patches, snapshot} = item
          let patchChange
          // eslint-disable-next-line max-depth
          try {
            patchChange = patchesToChange(patches, change.value, snapshot, blockContentType)
            // Restore the selection
            patchChange.applyOperations([createSelectionOperation(item.change)]).focus()
            patchChange.__isUndoRedo = 'redo'
            stack.undo.push(item)
          } catch (err) {
            // eslint-disable-next-line no-console
            console.error('Could not apply redo step', item, err)
          }
          // eslint-disable-next-line max-depth
          if (patchChange) {
            onChange(patchChange)
          }
        }
        return change
      }
      return next()
    }
  }
}
