// @flow

import {editorValueToBlocks} from '@sanity/block-tools'
import type {
  BlockContentFeatures,
  FormBuilderValue,
  SlateValue,
  SlateOperation,
  Type
} from '../typeDefs'
import {unset, set, insert, setIfMissing} from '../../../PatchEvent'
import {Operation} from 'slate'

export const VALUE_TO_JSON_OPTS = {
  preserveData: true,
  preserveKeys: true,
  preserveSelection: false,
  preserveHistory: false
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
    patches.push(set(block, [{_key: block._key}]))
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
    formBuilderValue: ?(FormBuilderValue[])
  ) {
    // console.log(JSON.stringify(operation.toJSON(), null, 2))
    switch (operation.type) {
      case 'insert_text':
        return setNodePatch(operation, beforeValue, afterValue, formBuilderValue)
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
