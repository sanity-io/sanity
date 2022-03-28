/* eslint-disable max-statements */
/* eslint-disable complexity */
import * as DMP from 'diff-match-patch'
import {debounce, isEqual} from 'lodash'
import {Subject} from 'rxjs'
import {
  Descendant,
  Editor,
  Element as SlateElement,
  InsertNodeOperation,
  InsertTextOperation,
  MergeNodeOperation,
  MoveNodeOperation,
  Node,
  Operation,
  Path,
  Range,
  RemoveNodeOperation,
  RemoveTextOperation,
  SetNodeOperation,
  SplitNodeOperation,
  Text as SlateText,
  Transforms,
} from 'slate'
import {isKeySegment} from '@sanity/types'
import {setIfMissing, unset} from '../../patch/PatchEvent'
import type {Patch} from '../../types/patch'

import {
  fromSlateValue,
  isEqualToEmptyEditor,
  findBlockAndIndexFromPath,
  findChildAndIndexFromPath,
} from '../../utils/values'
import {PortableTextBlock, PortableTextFeatures} from '../../types/portableText'
import {EditorChange, PatchObservable, PortableTextSlateEditor} from '../../types/editor'
import {debugWithName} from '../../utils/debug'
import {PATCHING, isPatching} from '../../utils/withoutPatching'
import {KEY_TO_VALUE_ELEMENT} from '../../utils/weakMaps'

const debug = debugWithName('plugin:withPatches')

// eslint-disable-next-line new-cap
const dmp = new DMP.diff_match_patch()

const THROTTLE_EDITOR_MS = 500

export type PatchFunctions = {
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

export function createWithPatches(
  {
    insertNodePatch,
    insertTextPatch,
    mergeNodePatch,
    moveNodePatch,
    removeNodePatch,
    removeTextPatch,
    setNodePatch,
    splitNodePatch,
  }: PatchFunctions,
  change$: Subject<EditorChange>,
  portableTextFeatures: PortableTextFeatures,
  incomingPatches$?: PatchObservable
): (editor: PortableTextSlateEditor) => PortableTextSlateEditor {
  let previousChildren: Descendant[]
  let previousSelection: Range | null
  return function withPatches(editor: PortableTextSlateEditor) {
    PATCHING.set(editor, true)
    previousChildren = editor.children

    // This will cancel the throttle when the user is not producing any patches for a short time
    const cancelThrottleDebounced = debounce(() => {
      change$.next({type: 'throttle', throttle: false})
    }, THROTTLE_EDITOR_MS)

    // Inspect incoming patches and adjust editor selection accordingly.
    if (incomingPatches$) {
      incomingPatches$.subscribe((patch: Patch) => {
        debug(`Handling incoming patch ${JSON.stringify(patch)}`)
        debug(`Selection is ${JSON.stringify(previousSelection)}`)
        debug(`Adjusting selection for patch ${patch.type}`)
        adjustSelection(editor, patch, previousChildren, previousSelection, portableTextFeatures)
      })
    }

    const {apply} = editor

    editor.apply = (operation: Operation): void | Editor => {
      let patches: Patch[] = []

      // The previous value is needed to figure out the _key of deleted nodes. The editor.children would no
      // longer contain that information if the node is already deleted.
      // debug('setting previous children', operation, editor.children)
      previousChildren = editor.children

      const editorWasEmpty = isEqualToEmptyEditor(previousChildren as Node[], portableTextFeatures)

      // Apply the operation
      apply(operation)

      previousSelection = editor.selection

      if (!isPatching(editor)) {
        debug(`Editor is not producing patch for operation ${operation.type}`, operation)
        return editor
      }

      if (editorWasEmpty && operation.type !== 'set_selection') {
        patches = [setIfMissing(previousChildren, [])]
      }
      switch (operation.type) {
        case 'insert_text':
          patches = [...patches, ...insertTextPatch(editor, operation, previousChildren)]
          break
        case 'remove_text':
          patches = [...patches, ...removeTextPatch(editor, operation, previousChildren)]
          break
        case 'remove_node':
          patches = [...patches, ...removeNodePatch(editor, operation, previousChildren)]
          break
        case 'split_node':
          patches = [...patches, ...splitNodePatch(editor, operation, previousChildren)]
          break
        case 'insert_node':
          patches = [...patches, ...insertNodePatch(editor, operation, previousChildren)]
          break
        case 'set_node':
          patches = [...patches, ...setNodePatch(editor, operation, previousChildren)]
          break
        case 'merge_node':
          patches = [...patches, ...mergeNodePatch(editor, operation, previousChildren)]
          break
        case 'move_node':
          patches = [...patches, ...moveNodePatch(editor, operation, previousChildren)]
          break
        case 'set_selection':
        default:
        // Do nothing
      }

      // Unset the value if editor has become empty
      if (
        isEqualToEmptyEditor(editor.children, portableTextFeatures) &&
        operation.type !== 'set_selection'
      ) {
        patches.push(unset([]))
        change$.next({
          type: 'unset',
          previousValue: fromSlateValue(
            previousChildren,
            portableTextFeatures.types.block.name,
            KEY_TO_VALUE_ELEMENT.get(editor)
          ),
        })
      }

      if (patches.length > 0) {
        // Signal throttling
        change$.next({type: 'throttle', throttle: true})
        // Emit all patches
        patches.forEach((patch) => {
          change$.next({
            type: 'patch',
            patch,
          })
        })
        cancelThrottleDebounced()
      }
      return editor
    }
    return editor
  }
}

function adjustSelection(
  editor: Editor,
  patch: Patch,
  previousChildren: (Node | Partial<Node>)[],
  previousSelection: Range | null,
  portableTextFeatures: PortableTextFeatures
): void {
  const selection = editor.selection
  if (selection === null) {
    debug('No selection, not adjusting selection')
    return
  }
  let newSelection = selection
  // Text patches on same line
  if (patch.type === 'diffMatchPatch') {
    const [block, blockIndex] = findBlockAndIndexFromPath(patch.path[0], editor.children)
    const [, childIndex] = block ? findChildAndIndexFromPath(patch.path[2], block) : [undefined, -1]
    const onSameBlock =
      selection.focus.path[0] === blockIndex && selection.focus.path[1] === childIndex

    if (onSameBlock) {
      const parsed = dmp.patch_fromText(patch.value)[0]
      if (parsed) {
        let testString = ''
        for (const diff of parsed.diffs) {
          // eslint-disable-next-line max-depth
          if (diff[0] === 0) {
            testString += diff[1]
          } else {
            break
          }
        }
        // This thing is exotic but actually works!
        const isBeforeUserSelection =
          parsed.start1 !== null &&
          parsed.start1 + testString.length < selection.focus.offset &&
          parsed.start1 + testString.length < selection.anchor.offset

        const distance = parsed.length2 - parsed.length1

        if (isBeforeUserSelection) {
          debug('Adjusting selection for diffMatchPatch on same line')
          // debug(
          //   `Adjusting selection for diffMatchPatch on same line ${JSON.stringify({
          //     parsed,
          //     distance,
          //     isBeforeUserSelection,
          //     isRemove: parsed.diffs.some(diff => diff[0] === -1),
          //     testString
          //   })}`
          // )
          newSelection = {...selection}
          newSelection.focus = {...selection.focus}
          newSelection.anchor = {...selection.anchor}
          newSelection.anchor.offset += distance
          newSelection.focus.offset += distance
        }
        // TODO: account for intersecting selections!
      }
    }
  }

  // Unset patches on children within a block
  if (patch.type === 'unset' && patch.path.length === 3) {
    const [oldBlock, oldBlockIndex] = findBlockAndIndexFromPath(patch.path[0], previousChildren)
    const [, childIndex] = oldBlock
      ? findChildAndIndexFromPath(patch.path[2], oldBlock)
      : [undefined, -1]
    if (
      oldBlock &&
      selection.focus.path[0] === oldBlockIndex &&
      selection.focus.path[1] >= childIndex &&
      childIndex > -1
    ) {
      const prevIndexOrLastIndex =
        childIndex === -1 || oldBlock.children.length === 1
          ? oldBlock.children.length - 1
          : childIndex
      const prevOrLastChild = oldBlock.children[prevIndexOrLastIndex]
      const prevText = (SlateText.isText(prevOrLastChild) && prevOrLastChild.text) || ''
      newSelection = {...selection}
      const beforePrevOrLast = oldBlock.children[Math.max(0, prevIndexOrLastIndex - 1)]
      const textBeforePrevOrLast = SlateText.isText(beforePrevOrLast) ? beforePrevOrLast.text : ''
      const textBefore = SlateText.isText(beforePrevOrLast) ? beforePrevOrLast.text : ''
      if (
        Path.isAfter(selection.anchor.path, [oldBlockIndex, prevIndexOrLastIndex]) ||
        Path.endsAt(selection.anchor.path, [oldBlockIndex, prevIndexOrLastIndex])
      ) {
        newSelection.anchor = {...selection.anchor}
        newSelection.anchor.path = [
          newSelection.anchor.path[0],
          Math.max(0, prevIndexOrLastIndex - 1),
        ]
        newSelection.anchor.offset = textBefore.length + textBeforePrevOrLast.length
      }
      if (
        Path.isAfter(selection.focus.path, [oldBlockIndex, prevIndexOrLastIndex]) ||
        Path.endsAt(selection.focus.path, [oldBlockIndex, prevIndexOrLastIndex])
      ) {
        newSelection.focus = {...selection.focus}
        newSelection.focus.path = [
          newSelection.focus.path[0],
          Math.max(0, prevIndexOrLastIndex - 1),
        ]
        newSelection.focus.offset = textBefore.length + textBeforePrevOrLast.length
      }
      if (Path.isAfter(selection.anchor.path, [oldBlockIndex, prevIndexOrLastIndex])) {
        newSelection.anchor = {...selection.anchor}
        newSelection.anchor.path = [oldBlockIndex, prevIndexOrLastIndex]
        newSelection.anchor.offset = selection.anchor.offset + prevText.length
      }
      if (Path.isAfter(selection.focus.path, [oldBlockIndex, prevIndexOrLastIndex])) {
        newSelection.focus = {...selection.focus}
        newSelection.focus.path = [oldBlockIndex, prevIndexOrLastIndex]
        newSelection.focus.offset = selection.focus.offset + prevText.length
      }
      if (!isEqual(newSelection, selection)) {
        debug('adjusting selection for unset block child')
      }
    }
  }

  // Unset patches on block level
  if (patch.type === 'unset' && patch.path.length === 1) {
    const blkAndIdx = findBlockAndIndexFromPath(patch.path[0], previousChildren)

    let [, blockIndex] = blkAndIdx
    const [block] = blkAndIdx

    // Deal with editing being done above the removed block
    if (
      block &&
      blockIndex !== undefined &&
      previousSelection &&
      !Path.isAfter(selection.anchor.path, [blockIndex]) &&
      !Path.isAfter(selection.focus.path, [blockIndex])
    ) {
      newSelection = {...previousSelection}
      newSelection.anchor = {...previousSelection.anchor}
      newSelection.anchor.path = [
        Math.max(0, previousSelection.anchor.path[0] - 1),
        ...previousSelection.anchor.path.slice(1),
      ]
      newSelection.focus = {...previousSelection.focus}
      newSelection.focus.path = [
        Math.max(0, previousSelection.focus.path[0] - 1),
        ...previousSelection.focus.path.slice(1),
      ]
    }

    // Deal with editing being done below or on the removed block
    if (
      block &&
      blockIndex !== undefined &&
      !Path.isBefore(selection.anchor.path, [blockIndex]) &&
      !Path.isBefore(selection.focus.path, [blockIndex])
    ) {
      const isTextBlock = block._type === portableTextFeatures.types.block.name

      const addToOffset =
        isTextBlock &&
        isEqual(selection.anchor.path[0], blockIndex) &&
        isEqual(selection.focus.path[0], blockIndex)
          ? block.children
              .map(
                (child) =>
                  SlateText.isText(child) &&
                  child._type === portableTextFeatures.types.span.name &&
                  child.text
              )
              .filter(Boolean)
              .join('').length + 1
          : 0

      if (selection.anchor.path[0] === blockIndex && selection.focus.path[0] === blockIndex) {
        blockIndex = Math.max(0, selection.focus.path[0] - 1)
      }
      if (Path.isAfter(selection.anchor.path, [blockIndex])) {
        newSelection = {...selection}
        newSelection.anchor = {...newSelection.anchor}
        newSelection.anchor.path = [
          Math.max(0, newSelection.anchor.path[0] - 1),
          ...newSelection.anchor.path.slice(1),
        ]
        newSelection.anchor.offset += addToOffset
      }
      if (Path.isAfter(selection.focus.path, [blockIndex])) {
        newSelection = {...(newSelection || selection)}
        newSelection.focus = {...newSelection.focus}
        newSelection.focus.path = [
          Math.max(0, newSelection.focus.path[0] - 1),
          ...newSelection.focus.path.slice(1),
        ]
        newSelection.focus.offset += addToOffset
      }
    }
  }

  // Unset patches on child level
  if (patch.type === 'unset' && patch.path.length > 2) {
    const blkAndIdx = findBlockAndIndexFromPath(patch.path[0], previousChildren)
    const [, blockIndex] = blkAndIdx
    const [block] = blkAndIdx
    const isTextBlock = block && block._type === portableTextFeatures.types.block.name
    const first = patch.path[0]

    const offset =
      isTextBlock &&
      previousSelection &&
      isKeySegment(first) &&
      first._key === block._key &&
      previousSelection?.anchor.path[0] === blockIndex &&
      previousSelection?.focus.path[0] === blockIndex
        ? block.children
            .map(
              (child, index) =>
                previousSelection &&
                index < previousSelection.focus.path[1] &&
                index < previousSelection.anchor.path[1] &&
                SlateText.isText(child) &&
                child._type === portableTextFeatures.types.span.name &&
                child.text
            )
            .filter(Boolean)
            .join('').length
        : 0
    if (offset && previousSelection) {
      newSelection = {...selection}
      newSelection.anchor = {...newSelection.anchor}
      newSelection.focus = {...newSelection.focus}
      newSelection.anchor.offset = offset + previousSelection.anchor.offset
      newSelection.focus.offset = offset + previousSelection.focus.offset
    }
  }

  // Insert patches on block level
  if (patch.type === 'insert' && patch.path.length === 1) {
    const [block, blockIndex] = findBlockAndIndexFromPath(patch.path[0], editor.children)
    if (block && typeof blockIndex !== 'undefined') {
      newSelection = {...selection}
      if (Path.isAfter(selection.anchor.path, [blockIndex])) {
        newSelection.anchor = {...selection.anchor}
        newSelection.anchor.path = [
          newSelection.anchor.path[0] + patch.items.length,
          ...newSelection.anchor.path.slice(1),
        ]
      }
      if (Path.isAfter(selection.focus.path, [blockIndex])) {
        newSelection.focus = {...selection.focus}
        newSelection.focus.path = [
          newSelection.focus.path[0] + patch.items.length,
          ...newSelection.focus.path.slice(1),
        ]
      }
    }
  }

  // Insert patches on block children level
  if (patch.type === 'insert' && patch.path.length === 3) {
    const [block, blockIndex] = findBlockAndIndexFromPath(patch.path[0], editor.children)
    const [, childIndex] = block ? findChildAndIndexFromPath(patch.path[2], block) : [undefined, -1]
    if (selection.focus.path[0] === blockIndex && selection.focus.path[1] === childIndex) {
      const nextIndex = childIndex + patch.items.length
      const iBlock = editor.children[blockIndex]
      const blockChildren = SlateElement.isElement(iBlock) && (iBlock.children as Node[])
      const nextBlock = editor.children[blockIndex + 1]
      const item = patch.items[0] as PortableTextBlock
      const nextChild = blockChildren && blockChildren[nextIndex]
      const isSplitOperation =
        !nextChild &&
        Editor.isBlock(editor, nextBlock) &&
        nextBlock.children &&
        nextBlock.children[0] &&
        typeof nextBlock.children[0]._key === 'string' &&
        isEqual(nextBlock.children[0]._key, item._key)
      const [node] = Editor.node(editor, selection)
      const nodeText = SlateText.isText(node) && node.text
      if (nodeText && selection.focus.offset >= nodeText.length) {
        if (!isSplitOperation) {
          newSelection = {...selection}
          newSelection.focus = {...selection.focus}
          newSelection.anchor = {...selection.anchor}
          newSelection.anchor.path = Path.next(newSelection.anchor.path)
          newSelection.anchor.offset = nodeText.length - newSelection.anchor.offset
          newSelection.focus.path = Path.next(newSelection.focus.path)
          newSelection.focus.offset = nodeText.length - newSelection.focus.offset
          editor.selection = newSelection
        } else if (selection.focus.offset >= nodeText.length) {
          debug('adjusting selection for split node')
          newSelection = {...selection}
          newSelection.focus = {...selection.focus}
          newSelection.anchor = {...selection.anchor}
          newSelection.anchor.path = [blockIndex + 1, 0]
          newSelection.anchor.offset = selection.anchor.offset - nodeText.length || 0
          newSelection.focus.path = [blockIndex + 1, 0]
          newSelection.focus.offset = selection.focus.offset - nodeText.length || 0
        }
      }
    }
  }
  if (isEqual(newSelection, editor.selection)) {
    debug('Selection is the same, not adjusting')
    return
  }
  Transforms.select(editor, newSelection)
  // editor.onChange()
}
