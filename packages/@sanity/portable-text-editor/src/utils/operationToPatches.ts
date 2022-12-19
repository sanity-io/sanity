import {Path, PortableTextSpan, PortableTextTextBlock} from '@sanity/types'
import {omitBy, isUndefined, get} from 'lodash'
import {
  Editor,
  MoveNodeOperation,
  InsertTextOperation,
  RemoveTextOperation,
  SetNodeOperation,
  InsertNodeOperation,
  SplitNodeOperation,
  RemoveNodeOperation,
  MergeNodeOperation,
  Descendant,
} from 'slate'
import {set, insert, unset, diffMatchPatch, setIfMissing} from '../patch/PatchEvent'
import type {Patch, InsertPosition} from '../types/patch'
import {PatchFunctions} from '../editor/plugins/createWithPatches'
import {PortableTextMemberSchemaTypes} from '../types/editor'
import {fromSlateValue} from './values'
import {debugWithName} from './debug'

const debug = debugWithName('operationToPatches')

export function createOperationToPatches(types: PortableTextMemberSchemaTypes): PatchFunctions {
  const textBlockName = types.block.name
  function insertTextPatch(
    editor: Editor,
    operation: InsertTextOperation,
    beforeValue: Descendant[]
  ) {
    debug('Operation', JSON.stringify(operation, null, 2))
    const block =
      editor.isTextBlock(editor.children[operation.path[0]]) && editor.children[operation.path[0]]
    if (!block) {
      throw new Error('Could not find block')
    }
    const textChild =
      editor.isTextBlock(block) &&
      editor.isTextSpan(block.children[operation.path[1]]) &&
      (block.children[operation.path[1]] as PortableTextSpan)
    if (!textChild) {
      throw new Error('Could not find child')
    }
    const path: Path = [{_key: block._key}, 'children', {_key: textChild._key}, 'text']
    const prevBlock = beforeValue[operation.path[0]]
    const prevChild = editor.isTextBlock(prevBlock) && prevBlock.children[operation.path[1]]
    const prevText = editor.isTextSpan(prevChild) ? prevChild.text : ''
    const patch = diffMatchPatch(prevText, textChild.text, path)
    return patch.value.length ? [patch] : []
  }

  function removeTextPatch(
    editor: Editor,
    operation: RemoveTextOperation,
    beforeValue: Descendant[]
  ) {
    const block = editor && editor.children[operation.path[0]]
    if (!block) {
      throw new Error('Could not find block')
    }
    const child = (editor.isTextBlock(block) && block.children[operation.path[1]]) || undefined
    const textChild: PortableTextSpan | undefined = editor.isTextSpan(child) ? child : undefined
    if (child && !textChild) {
      throw new Error('Expected span')
    }
    if (!textChild) {
      throw new Error('Could not find child')
    }
    const path: Path = [{_key: block._key}, 'children', {_key: textChild._key}, 'text']
    const beforeBlock = beforeValue[operation.path[0]]
    const prevTextChild = editor.isTextBlock(beforeBlock) && beforeBlock.children[operation.path[1]]
    const prevText = editor.isTextSpan(prevTextChild) && prevTextChild.text
    const patch = diffMatchPatch(prevText || '', textChild.text, path)
    return patch.value ? [patch] : []
  }

  function setNodePatch(editor: Editor, operation: SetNodeOperation) {
    if (operation.path.length === 1) {
      const block = editor.children[operation.path[0]]
      if (typeof block._key !== 'string') {
        throw new Error('Expected block to have a _key')
      }
      const setNode = omitBy(
        {...editor.children[operation.path[0]], ...operation.newProperties},
        isUndefined
      )
      return [set(fromSlateValue([setNode], textBlockName)[0], [{_key: block._key}])]
    } else if (operation.path.length === 2) {
      const block = editor.children[operation.path[0]]
      if (editor.isTextBlock(block)) {
        const child = block.children[operation.path[1]]
        if (child) {
          const blockKey = block._key
          const childKey = child._key
          const patches: Patch[] = []
          Object.keys(operation.newProperties).forEach((keyName) => {
            const val = get(operation.newProperties, keyName)
            patches.push(set(val, [{_key: blockKey}, 'children', {_key: childKey}, keyName]))
          })
          return patches
        }
        throw new Error('Could not find a valid child')
      }
      throw new Error('Could not find a valid block')
    } else {
      throw new Error(`Unexpected path encountered: ${JSON.stringify(operation.path)}`)
    }
  }

  function insertNodePatch(
    editor: Editor,
    operation: InsertNodeOperation,
    beforeValue: Descendant[]
  ): Patch[] {
    const block = beforeValue[operation.path[0]]
    if (operation.path.length === 1) {
      const position = operation.path[0] === 0 ? 'before' : 'after'
      const beforeBlock = beforeValue[operation.path[0] - 1]
      const targetKey = operation.path[0] === 0 ? block?._key : beforeBlock?._key
      if (targetKey) {
        return [
          insert([fromSlateValue([operation.node], textBlockName)[0]], position, [
            {_key: targetKey},
          ]),
        ]
      }
      return [
        setIfMissing(beforeValue, []),
        insert([fromSlateValue([operation.node], textBlockName)[0]], 'before', [operation.path[0]]),
      ]
    } else if (operation.path.length === 2 && editor.children[operation.path[0]]) {
      if (!editor.isTextBlock(block)) {
        throw new Error('Invalid block')
      }
      const position =
        block.children.length === 0 || !block.children[operation.path[1] - 1] ? 'before' : 'after'
      const blk = fromSlateValue(
        [
          {
            _key: 'bogus',
            _type: textBlockName,
            children: [operation.node as Descendant],
          },
        ],
        textBlockName
      )[0] as PortableTextTextBlock
      const child = blk.children[0]
      return [
        insert([child], position, [
          {_key: block._key},
          'children',
          block.children.length <= 1 || !block.children[operation.path[1] - 1]
            ? 0
            : {_key: block.children[operation.path[1] - 1]._key},
        ]),
      ]
    }
    throw new Error(
      `Unexpected path encountered: ${JSON.stringify(operation.path)} - ${JSON.stringify(
        beforeValue
      )}`
    )
  }

  function splitNodePatch(
    editor: Editor,
    operation: SplitNodeOperation,
    beforeValue: Descendant[]
  ) {
    const patches: Patch[] = []
    const splitBlock = editor.children[operation.path[0]]
    if (!editor.isTextBlock(splitBlock)) {
      throw new Error(
        `Block with path ${JSON.stringify(
          operation.path[0]
        )} is not a text block and can't be split`
      )
    }
    if (operation.path.length === 1) {
      const oldBlock = beforeValue[operation.path[0]]
      if (editor.isTextBlock(oldBlock)) {
        const targetValue = fromSlateValue(
          [editor.children[operation.path[0] + 1]],
          textBlockName
        )[0]
        if (targetValue) {
          patches.push(insert([targetValue], 'after', [{_key: splitBlock._key}]))
          const spansToUnset = oldBlock.children.slice(operation.position)
          spansToUnset.forEach((span) => {
            const path = [{_key: oldBlock._key}, 'children', {_key: span._key}]
            patches.push(unset(path))
          })
        }
      }
      return patches
    }
    if (operation.path.length === 2) {
      const splitSpan = splitBlock.children[operation.path[1]]
      if (editor.isTextSpan(splitSpan)) {
        const targetSpans = (
          fromSlateValue(
            [
              {
                ...splitBlock,
                children: splitBlock.children.slice(operation.path[1] + 1, operation.path[1] + 2),
              } as Descendant,
            ],
            textBlockName
          )[0] as PortableTextTextBlock
        ).children

        patches.push(
          insert(targetSpans, 'after', [
            {_key: splitBlock._key},
            'children',
            {_key: splitSpan._key},
          ])
        )
        patches.push(
          set(splitSpan.text, [{_key: splitBlock._key}, 'children', {_key: splitSpan._key}, 'text'])
        )
      }
      return patches
    }
    return patches
  }

  function removeNodePatch(
    editor: Editor,
    operation: RemoveNodeOperation,
    beforeValue: Descendant[]
  ) {
    const block = beforeValue[operation.path[0]]
    if (operation.path.length === 1) {
      // Remove a single block
      if (block && block._key) {
        return [unset([{_key: block._key}])]
      }
      throw new Error('Block not found')
    } else if (operation.path.length === 2) {
      const spanToRemove =
        editor.isTextBlock(block) && block.children && block.children[operation.path[1]]
      if (spanToRemove) {
        return [unset([{_key: block._key}, 'children', {_key: spanToRemove._key}])]
      }
      // If it was not there before, do nothing
      debug('Span not found in editor trying to remove node')
      return []
    } else {
      throw new Error(`Unexpected path encountered: ${JSON.stringify(operation.path)}`)
    }
  }

  function mergeNodePatch(
    editor: Editor,
    operation: MergeNodeOperation,
    beforeValue: Descendant[]
  ) {
    const patches: Patch[] = []
    if (operation.path.length === 1) {
      const block = beforeValue[operation.path[0]]
      const targetKey = block && block._key
      if (targetKey) {
        const newBlock = fromSlateValue([editor.children[operation.path[0] - 1]], textBlockName)[0]
        patches.push(set(newBlock, [{_key: newBlock._key}]))
        patches.push(unset([{_key: targetKey}]))
      } else {
        throw new Error('Target key not found!')
      }
    } else if (operation.path.length === 2) {
      const block = beforeValue[operation.path[0]]
      const mergedSpan =
        (editor.isTextBlock(block) && block.children[operation.path[1]]) || undefined
      const targetBlock = editor.children[operation.path[0]]
      if (!editor.isTextBlock(targetBlock)) {
        throw new Error('Invalid block')
      }
      const targetSpan = targetBlock.children[operation.path[1] - 1]
      if (editor.isTextSpan(targetSpan)) {
        // Set the merged span with it's new value
        patches.push(
          set(targetSpan.text, [{_key: block._key}, 'children', {_key: targetSpan._key}, 'text'])
        )
        if (mergedSpan) {
          patches.push(unset([{_key: block._key}, 'children', {_key: mergedSpan._key}]))
        }
      }
    } else {
      throw new Error(`Unexpected path encountered: ${JSON.stringify(operation.path)}`)
    }
    return patches
  }

  function moveNodePatch(editor: Editor, operation: MoveNodeOperation, beforeValue: Descendant[]) {
    const patches: Patch[] = []
    const block = beforeValue[operation.path[0]]
    const targetBlock = beforeValue[operation.newPath[0]]
    if (operation.path.length === 1) {
      const position: InsertPosition = operation.path[0] > operation.newPath[0] ? 'before' : 'after'
      patches.push(unset([{_key: block._key}]))
      patches.push(
        insert([fromSlateValue([block], textBlockName)[0]], position, [{_key: targetBlock._key}])
      )
    } else if (
      operation.path.length === 2 &&
      editor.isTextBlock(block) &&
      editor.isTextBlock(targetBlock)
    ) {
      const child = block.children[operation.path[1]]
      const targetChild = targetBlock.children[operation.newPath[1]]
      const position = operation.newPath[1] === targetBlock.children.length ? 'after' : 'before'
      const childToInsert = (fromSlateValue([block], textBlockName)[0] as PortableTextTextBlock)
        .children[operation.path[1]]
      patches.push(unset([{_key: block._key}, 'children', {_key: child._key}]))
      patches.push(
        insert([childToInsert], position, [
          {_key: targetBlock._key},
          'children',
          {_key: targetChild._key},
        ])
      )
    }
    return patches
  }

  return {
    insertNodePatch,
    insertTextPatch,
    mergeNodePatch,
    moveNodePatch,
    removeNodePatch,
    removeTextPatch,
    setNodePatch,
    splitNodePatch,
  }
}
