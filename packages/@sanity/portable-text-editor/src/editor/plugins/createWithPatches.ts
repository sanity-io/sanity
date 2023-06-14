/* eslint-disable max-nested-callbacks */
import {Subject} from 'rxjs'
import {
  Descendant,
  Editor,
  InsertNodeOperation,
  InsertTextOperation,
  MergeNodeOperation,
  MoveNodeOperation,
  Operation,
  RemoveNodeOperation,
  RemoveTextOperation,
  SetNodeOperation,
  SplitNodeOperation,
} from 'slate'
import {insert, setIfMissing, unset} from '../../patch/PatchEvent'
import type {Patch} from '../../types/patch'

import {fromSlateValue, isEqualToEmptyEditor} from '../../utils/values'
import {
  EditorChange,
  PatchObservable,
  PortableTextMemberSchemaTypes,
  PortableTextSlateEditor,
} from '../../types/editor'
import {debugWithName} from '../../utils/debug'
import {PATCHING, isPatching, withoutPatching} from '../../utils/withoutPatching'
import {KEY_TO_VALUE_ELEMENT} from '../../utils/weakMaps'
import {createPatchToOperations} from '../../utils/patchToOperations'
import {withPreserveKeys} from '../../utils/withPreserveKeys'
import {withoutSaving} from './createWithUndoRedo'

const debug = debugWithName('plugin:withPatches')

export interface PatchFunctions {
  insertNodePatch: (
    editor: PortableTextSlateEditor,
    operation: InsertNodeOperation,
    previousChildren: Descendant[]
  ) => Patch[]
  insertTextPatch: (
    editor: PortableTextSlateEditor,
    operation: InsertTextOperation,
    previousChildren: Descendant[]
  ) => Patch[]
  mergeNodePatch: (
    editor: PortableTextSlateEditor,
    operation: MergeNodeOperation,
    previousChildren: Descendant[]
  ) => Patch[]
  moveNodePatch: (
    editor: PortableTextSlateEditor,
    operation: MoveNodeOperation,
    previousChildren: Descendant[]
  ) => Patch[]
  removeNodePatch: (
    editor: PortableTextSlateEditor,
    operation: RemoveNodeOperation,
    previousChildren: Descendant[]
  ) => Patch[]
  removeTextPatch: (
    editor: PortableTextSlateEditor,
    operation: RemoveTextOperation,
    previousChildren: Descendant[]
  ) => Patch[]
  setNodePatch: (
    editor: PortableTextSlateEditor,
    operation: SetNodeOperation,
    previousChildren: Descendant[]
  ) => Patch[]
  splitNodePatch: (
    editor: PortableTextSlateEditor,
    operation: SplitNodeOperation,
    previousChildren: Descendant[]
  ) => Patch[]
}

interface Options {
  change$: Subject<EditorChange>
  keyGenerator: () => string
  patches$?: PatchObservable
  patchFunctions: PatchFunctions
  readOnly: boolean
  schemaTypes: PortableTextMemberSchemaTypes
}

export function createWithPatches({
  change$,
  patches$,
  patchFunctions,
  readOnly,
  schemaTypes,
}: Options): (editor: PortableTextSlateEditor) => PortableTextSlateEditor {
  // The previous editor children are needed to figure out the _key of deleted nodes
  // The editor.children would no longer contain that information if the node is already deleted.
  let previousChildren: Descendant[]

  const patchToOperations = createPatchToOperations(schemaTypes)
  return function withPatches(editor: PortableTextSlateEditor) {
    PATCHING.set(editor, true)
    previousChildren = [...editor.children]

    const {apply} = editor

    if (patches$) {
      editor.subscriptions.push(() => {
        debug('Subscribing to patches$')
        const sub = patches$.subscribe(({patches}) => {
          const remotePatches = patches.filter((p) => p.origin !== 'local')
          if (remotePatches.length !== 0) {
            debug('Remote patches', patches)
            Editor.withoutNormalizing(editor, () => {
              remotePatches.forEach((patch) => {
                debug(`Handling remote patch ${JSON.stringify(patch)}`)
                withoutPatching(editor, () => {
                  withoutSaving(editor, () => {
                    withPreserveKeys(editor, () => {
                      try {
                        patchToOperations(editor, patch)
                      } catch (err) {
                        debug('Got error trying to create operations from patch')
                        console.error(err)
                      }
                    })
                  })
                })
              })
            })
          }
        })
        return () => {
          debug('Unsubscribing to patches$')
          sub.unsubscribe()
        }
      })
    }
    editor.apply = (operation: Operation): void | Editor => {
      if (readOnly) {
        apply(operation)
        return editor
      }
      let patches: Patch[] = []

      // Update previous children here before we apply
      previousChildren = editor.children

      const editorWasEmpty = isEqualToEmptyEditor(previousChildren, schemaTypes)

      // Apply the operation
      apply(operation)

      const editorIsEmpty = isEqualToEmptyEditor(editor.children, schemaTypes)

      if (!isPatching(editor)) {
        debug(`Editor is not producing patch for operation ${operation.type}`, operation)
        return editor
      }

      // If the editor was empty and now isn't, insert the placeholder into it.
      if (editorWasEmpty && !editorIsEmpty && operation.type !== 'set_selection') {
        patches.push(insert(previousChildren, 'before', [0]))
      }

      switch (operation.type) {
        case 'insert_text':
          patches = [
            ...patches,
            ...patchFunctions.insertTextPatch(editor, operation, previousChildren),
          ]
          break
        case 'remove_text':
          patches = [
            ...patches,
            ...patchFunctions.removeTextPatch(editor, operation, previousChildren),
          ]
          break
        case 'remove_node':
          patches = [
            ...patches,
            ...patchFunctions.removeNodePatch(editor, operation, previousChildren),
          ]
          break
        case 'split_node':
          patches = [
            ...patches,
            ...patchFunctions.splitNodePatch(editor, operation, previousChildren),
          ]
          break
        case 'insert_node':
          patches = [
            ...patches,
            ...patchFunctions.insertNodePatch(editor, operation, previousChildren),
          ]
          break
        case 'set_node':
          patches = [
            ...patches,
            ...patchFunctions.setNodePatch(editor, operation, previousChildren),
          ]
          break
        case 'merge_node':
          patches = [
            ...patches,
            ...patchFunctions.mergeNodePatch(editor, operation, previousChildren),
          ]
          break
        case 'move_node':
          patches = [
            ...patches,
            ...patchFunctions.moveNodePatch(editor, operation, previousChildren),
          ]
          break
        case 'set_selection':
        default:
        // Do nothing
      }

      // Unset the value if a operation made the editor empty
      if (
        !editorWasEmpty &&
        editorIsEmpty &&
        ['merge_node', 'set_node', 'remove_text', 'remove_node'].includes(operation.type)
      ) {
        patches = [...patches, unset([])]
        change$.next({
          type: 'unset',
          previousValue: fromSlateValue(
            previousChildren,
            schemaTypes.block.name,
            KEY_TO_VALUE_ELEMENT.get(editor)
          ),
        })
      }

      // Prepend patches with setIfMissing if going from empty editor to something involving a patch.
      if (editorWasEmpty && patches.length > 0) {
        patches = [setIfMissing([], []), ...patches]
      }

      // Emit all patches
      if (patches.length > 0) {
        patches.forEach((patch) => {
          change$.next({
            type: 'patch',
            patch: {...patch, origin: 'local'},
          })
        })
      }
      return editor
    }
    return editor
  }
}
