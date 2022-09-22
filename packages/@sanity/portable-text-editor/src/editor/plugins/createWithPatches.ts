/* eslint-disable max-nested-callbacks */
import {Observable, Subject, Subscription} from 'rxjs'
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
import {debounce} from 'lodash'
import {insert, setIfMissing, unset} from '../../patch/PatchEvent'
import type {Patch} from '../../types/patch'

import {fromSlateValue, isEqualToEmptyEditor} from '../../utils/values'
import {PortableTextBlock, PortableTextFeatures} from '../../types/portableText'
import {EditorChange, PortableTextSlateEditor} from '../../types/editor'
import {debugWithName} from '../../utils/debug'
import {PATCHING, isPatching, withoutPatching} from '../../utils/withoutPatching'
import {KEY_TO_VALUE_ELEMENT} from '../../utils/weakMaps'
import {createPatchToOperations} from '../../utils/patchToOperations'
import {keyGenerator} from '../..'
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
  patchFunctions: PatchFunctions
  change$: Subject<EditorChange>
  portableTextFeatures: PortableTextFeatures
  syncValue: () => void
  incomingPatches$?: Observable<{
    patches: Patch[]
    snapshot: PortableTextBlock[] | undefined
  }>
}

export function createWithPatches({
  patchFunctions,
  change$,
  portableTextFeatures,
  syncValue,
  incomingPatches$,
}: Options): [
  editor: (editor: PortableTextSlateEditor) => PortableTextSlateEditor,
  cleanupFn: () => void
] {
  // The previous editor children are needed to figure out the _key of deleted nodes
  // The editor.children would no longer contain that information if the node is already deleted.
  let previousChildren: Descendant[]

  const patchToOperations = createPatchToOperations(portableTextFeatures, keyGenerator)
  let patchSubscription: Subscription
  const cleanupFn = () => {
    if (patchSubscription) {
      debug('Unsubscribing to patches')
      patchSubscription.unsubscribe()
    }
  }
  return [
    function withPatches(editor: PortableTextSlateEditor) {
      PATCHING.set(editor, true)

      previousChildren = [...editor.children]

      // Sync the with props.value in PortableTextEditor after we have processed batches of incoming patches.
      // This is only for consistency checking against the props.value, so it can be debounced without problems.
      const syncValueAfterIncomingPatches = debounce(() => syncValue(), 100, {
        trailing: true,
        leading: false,
      })

      // Subscribe and deal with incoming patches
      if (incomingPatches$) {
        debug('Subscribing to patches')
        patchSubscription = incomingPatches$.subscribe(({patches, snapshot}) => {
          debug('Incoming patches', patches)
          const remotePatches = patches.filter((p) => p.origin !== 'local')
          if (remotePatches.length !== 0) {
            Editor.withoutNormalizing(editor, () => {
              remotePatches.forEach((patch) => {
                debug(`Handling remote patch ${JSON.stringify(patch)}`)
                withoutPatching(editor, () => {
                  withoutSaving(editor, () => {
                    withPreserveKeys(editor, () => {
                      try {
                        patchToOperations(editor, patch, patches, snapshot)
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
          if (patches.length > 0) {
            syncValueAfterIncomingPatches()
          }
        })
      }
      const {apply} = editor
      editor.apply = (operation: Operation): void | Editor => {
        if (editor.readOnly) {
          apply(operation)
          return editor
        }
        let patches: Patch[] = []

        // Update previous children here before we apply
        previousChildren = editor.children

        const editorWasEmpty = isEqualToEmptyEditor(previousChildren, portableTextFeatures)

        // Apply the operation
        apply(operation)

        const editorIsEmpty = isEqualToEmptyEditor(editor.children, portableTextFeatures)

        if (!isPatching(editor)) {
          debug(`Editor is not producing patch for operation ${operation.type}`, operation)
          return editor
        }

        // Make sure the actual value is an array, and then insert the placeholder block into it
        // before we produce any other patches that will target that block.
        if (editorWasEmpty && operation.type !== 'set_selection') {
          patches.push(setIfMissing([], []))
          previousChildren.forEach((c, index) => {
            patches.push(
              insert(fromSlateValue([c], portableTextFeatures.types.block.name), 'before', [index])
            )
          })
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

        // Unset the value if the operation made the editor empty
        if (editorIsEmpty && ['remove_text', 'remove_node'].includes(operation.type)) {
          patches = [...patches, unset([])]
          change$.next({
            type: 'unset',
            previousValue: fromSlateValue(
              previousChildren,
              portableTextFeatures.types.block.name,
              KEY_TO_VALUE_ELEMENT.get(editor)
            ),
          })
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
    },
    cleanupFn,
  ]
}
