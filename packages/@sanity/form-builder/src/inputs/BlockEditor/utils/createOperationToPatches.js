// @flow

import {editorValueToBlocks} from '@sanity/block-tools'
import {Operation, Range} from 'slate'
import {get, isEqual} from 'lodash'
import type {
  Block,
  BlockContentFeatures,
  FormBuilderValue,
  SlateOperation,
  SlateNode,
  SlateValue,
  Type
} from '../typeDefs'
import {unset, set, insert, setIfMissing} from '../../../PatchEvent'

export const VALUE_TO_JSON_OPTS = {
  preserveData: true,
  preserveKeys: true,
  preserveSelection: false,
  preserveHistory: false
}

function findSpanTargetPath(
  nodeInEditorValue: SlateNode,
  offset: number,
  editorValue: SlateValue,
  block: Block
) {
  if (nodeInEditorValue.object !== 'text') {
    throw new Error('Not a text node!')
  }
  const nodeInEditorValueParent = editorValue.document.getParent(nodeInEditorValue.key)
  let count = 0
  let targetKey
  // Note: do 'some' here so we can short circuit it when we reach our target
  // and don't have to loop through everything
  nodeInEditorValueParent.nodes.some(node => {
    if (node.object === 'text') {
      let text = ''
      node.leaves.forEach(leaf => {
        text += leaf.text
        if (node === nodeInEditorValue && text.length > offset) {
          targetKey = `${block._key}${count}`
          return
        }
        count++
      })
    } else {
      count++
    }
    return node === nodeInEditorValue
  })
  if (targetKey) {
    return [{_key: block._key}, 'children', {_key: targetKey}, 'text']
  }
  throw new Error(`No target path found!`)
}

export default function createOperationToPatches(
  blockContentFeatures: BlockContentFeatures,
  blockContentType: Type
) {
  function toBlock(editorValue: SlateValue, index: number) {
    if (!editorValue.document.nodes.get(index)) {
      throw new Error(`No block found at index ${index} in value`)
    }
    return editorValueToBlocks(
      {
        document: {
          nodes: [editorValue.document.nodes.get(index).toJSON(VALUE_TO_JSON_OPTS)]
        }
      },
      blockContentType
    )[0]
  }

  // eslint-disable-next-line complexity
  function insertTextPatch(
    operation: Operation,
    beforeValue: SlateValue,
    afterValue: SlateValue,
    formBuilderValue: ?(FormBuilderValue[])
  ) {
    const patches = []
    // Make sure we have a document / start block first
    if (!formBuilderValue || formBuilderValue.length === 0) {
      // Value is undefined
      if (!formBuilderValue) {
        patches.push(
          setIfMissing(editorValueToBlocks(afterValue.toJSON(VALUE_TO_JSON_OPTS), blockContentType))
        )
      }
      // Value is empty
      if (formBuilderValue && formBuilderValue.length === 0) {
        patches.push(
          set(editorValueToBlocks(afterValue.toJSON(VALUE_TO_JSON_OPTS), blockContentType), [])
        )
      }
    }
    const blockBefore = toBlock(beforeValue, operation.path.get(0))
    const blockAfter = toBlock(afterValue, operation.path.get(0))
    const nodeInEditorValue = afterValue.document.getNode(operation.path)
    const targetPath = findSpanTargetPath(
      nodeInEditorValue,
      operation.offset,
      afterValue,
      blockAfter
    )
    const targetKey = get(targetPath.slice(-2)[0], '_key')

    const span = blockAfter.children.find(child => child._key === targetKey)
    if (!span) {
      throw new Error(`Could not find span with key '${targetKey}' in block`)
    }

    const nodeInEditorValueBefore = beforeValue.document.getNode(operation.path)

    // If leaves have changed, and we are not on the end of the text,
    // set the whole block so we get the new block structure right
    if (
      nodeInEditorValue.leaves.size !== beforeValue.document.getNode(operation.path).leaves.size &&
      operation.offset !== nodeInEditorValueBefore.text.length
    ) {
      return setNodePatch(operation, beforeValue, afterValue, formBuilderValue)
    }

    // The span doesn't exist from before, so do an insert patch
    if (blockBefore.children.some(child => child._key === targetKey) === false) {
      const spanIndex = blockAfter.children.findIndex(child => child._key === targetKey)
      const targetInsertPath = targetPath
        .slice(0, -2)
        .concat({_key: blockAfter.children[spanIndex - 1]._key})
      return patches.concat(insert([span], 'after', targetInsertPath))
    }
    // Check if marks have changed and set the whole span with new marks if so
    const point = {path: operation.path, offset: operation.offset + 1}
    const textMarks = beforeValue.document
      .getMarksAtRange(
        Range.fromJSON({
          anchor: point,
          focus: point
        })
      )
      .map(m => m.type)
      .toArray()
    if (!isEqual(textMarks, span.marks)) {
      return patches.concat(set(span, targetPath.slice(0, -1)))
    }
    // Marks not changed, just set the text
    return patches.concat(set(span.text, targetPath))
  }

  function setNodePatch(
    operation: Operation,
    beforeValue: SlateValue,
    afterValue: SlateValue,
    formBuilderValue: ?(FormBuilderValue[])
  ) {
    const patches = []
    const block = toBlock(afterValue, operation.path.get(0))
    // Value is undefined
    if (!formBuilderValue) {
      patches.push(
        setIfMissing(editorValueToBlocks(afterValue.toJSON(VALUE_TO_JSON_OPTS), blockContentType))
      )
    }
    // Value is empty
    if (formBuilderValue && formBuilderValue.length === 0) {
      patches.push(
        set(editorValueToBlocks(afterValue.toJSON(VALUE_TO_JSON_OPTS), blockContentType), [])
      )
    }
    if (formBuilderValue && formBuilderValue.length > 0) {
      patches.push(set(block, [{_key: block._key}]))
    }
    // console.log(JSON.stringify(patches, null, 2))
    return patches
  }

  function insertNodePatch(operation: Operation, beforeValue: SlateValue, afterValue: SlateValue) {
    const block = toBlock(afterValue, operation.path.get(0))
    if (operation.path.size === 1) {
      let position = 'after'
      let positionPath
      if (operation.path.get(0) === 0) {
        const firstNode = beforeValue.document.nodes.first()
        positionPath = firstNode ? [{_key: firstNode.key}] : [0]
        position = 'before'
      } else {
        positionPath = [{_key: beforeValue.document.nodes.get(operation.path.get(0) - 1).key}]
      }
      return [insert([block], position, positionPath)]
    }
    return [set(block, [{_key: block._key}])]
  }

  function splitNodePatch(operation: Operation, afterValue: SlateValue) {
    const patches = []
    const splitBlock = toBlock(afterValue, operation.path.get(0))
    if (operation.path.size === 1) {
      patches.push(set(splitBlock, [{_key: splitBlock._key}]))
      const newBlock = toBlock(afterValue, operation.path.get(0) + 1)
      patches.push(insert([newBlock], 'after', [{_key: splitBlock._key}]))
    }
    if (operation.path.size > 1) {
      patches.push(set(splitBlock, [{_key: splitBlock._key}]))
    }
    return patches
  }

  function mergeNodePatch(operation: Operation, afterValue: SlateValue) {
    const patches = []
    if (operation.path.size === 1) {
      const mergedBlock = toBlock(afterValue, operation.path.get(0))
      const targetBlock = toBlock(afterValue, operation.path.get(0) - 1)
      patches.push(
        unset([
          {
            _key: mergedBlock._key
          }
        ])
      )
      patches.push(set(targetBlock, [{_key: targetBlock._key}]))
    }

    if (operation.path.size > 1) {
      const mergedBlock = toBlock(afterValue, operation.path.get(0))
      patches.push(set(mergedBlock, [{_key: mergedBlock._key}]))
    }

    return patches
  }

  function moveNodePatch(operation: Operation, beforeValue: SlateValue, afterValue: SlateValue) {
    const patches = []
    if (operation.path.size === 1) {
      if (operation.path.get(0) === operation.newPath.get(0)) {
        return []
      }
      const block = toBlock(beforeValue, operation.path.get(0))
      patches.push(
        unset([
          {
            _key: block._key
          }
        ])
      )
      let position = 'after'
      let positionPath
      if (operation.path.get(0) === 0) {
        const firstNode = beforeValue.document.nodes.first()
        positionPath = firstNode ? [{_key: firstNode.key}] : [0]
        position = 'before'
      } else {
        positionPath = [{_key: beforeValue.document.nodes.get(operation.path.get(0) - 1).key}]
      }
      patches.push(insert(block, position, positionPath))
    } else {
      const changedBlockFrom = toBlock(afterValue, operation.path.get(0))
      const changedBlockTo = toBlock(afterValue, operation.newPath.get(0))
      patches.push(set(changedBlockFrom, [{_key: changedBlockFrom._key}]))
      patches.push(set(changedBlockTo, [{_key: changedBlockTo._key}]))
    }
    return patches
  }

  function removeNodePatch(operation: Operation, beforeValue: SlateValue, afterValue: SlateValue) {
    const patches = []
    const block = toBlock(beforeValue, operation.path.get(0))
    if (operation.path.size === 1) {
      patches.push(unset([{_key: block._key}]))
    }
    if (operation.path.size > 1) {
      // Only relevant for 'block' type blocks
      if (block._type !== 'block') {
        return patches
      }
      const changedBlock = toBlock(afterValue, operation.path.get(0))
      patches.push(set(changedBlock, [{_key: changedBlock._key}]))
    }
    if (patches.length === 0) {
      throw new Error(
        `Don't know how to unset ${JSON.stringify(operation.toJSON(VALUE_TO_JSON_OPTS))}`
      )
    }
    return patches
  }

  // eslint-disable-next-line complexity
  return function operationToPatches(
    operation: SlateOperation,
    beforeValue: SlateValue,
    afterValue: SlateValue,
    formBuilderValue?: ?(FormBuilderValue[]) // This is optional, but needed for setting setIfMissing patches correctly
  ) {
    switch (operation.type) {
      case 'insert_text':
        return insertTextPatch(operation, beforeValue, afterValue, formBuilderValue)
      case 'remove_text':
        return setNodePatch(operation, beforeValue, afterValue, formBuilderValue)
      case 'add_mark':
        return setNodePatch(operation, beforeValue, afterValue, formBuilderValue)
      case 'remove_mark':
        return setNodePatch(operation, beforeValue, afterValue, formBuilderValue)
      case 'set_node':
        return setNodePatch(operation, beforeValue, afterValue, formBuilderValue)
      case 'insert_node':
        return insertNodePatch(operation, beforeValue, afterValue)
      case 'remove_node':
        return removeNodePatch(operation, beforeValue, afterValue)
      case 'split_node':
        return splitNodePatch(operation, afterValue)
      case 'merge_node':
        return mergeNodePatch(operation, beforeValue)
      case 'move_node':
        return moveNodePatch(operation, beforeValue, afterValue)
      default:
        return []
    }
  }
}
