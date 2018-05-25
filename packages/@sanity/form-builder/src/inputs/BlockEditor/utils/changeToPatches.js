// @flow
import type {Block, Type} from '../typeDefs'
import {Change, Operation} from 'slate'
import {flatten, isEqual} from 'lodash'
import {editorValueToBlocks, normalizeBlock} from '@sanity/block-tools'
import {unset, set, insert, setIfMissing} from '../../../PatchEvent'
import {applyAll} from '../../../simplePatch'

export const VALUE_TO_JSON_OPTS = {
  preserveData: true,
  preserveKeys: true,
  preserveSelection: false,
  preserveHistory: false
}

function setKey(key: string, block: Block) {
  block._key = key
  if (block._type === 'block') {
    block.children.forEach((child, index) => {
      child._key = `${block._key}${index}`
    })
  }
  return block
}

function setNodePatchSimple(
  change: Change,
  operation: Operation,
  blocks: Block[],
  blockContentType
) {
  const appliedBlocks = editorValueToBlocks(
    {
      document: {
        nodes: [
          change
            .applyOperations([operation])
            .value.document.nodes.get(operation.path[0])
            .toJSON(VALUE_TO_JSON_OPTS)
        ]
      }
    },
    blockContentType
  )

  // Value is undefined
  if (!blocks && appliedBlocks) {
    return setIfMissing(appliedBlocks)
  }
  // Value is empty
  if (blocks && blocks.length === 0) {
    return set(appliedBlocks, [])
  }
  const changedBlock = appliedBlocks[0]
  setKey(changedBlock._key, normalizeBlock(changedBlock))
  return set(changedBlock, [{_key: changedBlock._key}])
}

function setNodePatch(
  change: Change,
  operation: Operation,
  operations: Operation[],
  blocks: Block[],
  blockContentType
) {
  const appliedBlocks = editorValueToBlocks(
    change.applyOperations([operation]).value.toJSON(VALUE_TO_JSON_OPTS),
    blockContentType
  )
  // Value is undefined
  if (!blocks && appliedBlocks) {
    return setIfMissing(appliedBlocks)
  }
  // Value is empty
  if (blocks && blocks.length === 0) {
    return set(appliedBlocks, [])
  }
  const changedBlock = appliedBlocks[operation.path[0]]

  // Don't do anything if nothing is changed
  if (isEqual(changedBlock, blocks[operation.path[0]])) {
    return []
  }

  setKey(changedBlock._key, changedBlock)
  return set(normalizeBlock(changedBlock), [{_key: blocks[operation.path[0]]._key}])
}

function insertNodePatch(
  change: Change,
  operation: Operation,
  operations: Operation[],
  blocks: Block[],
  blockContentType
) {
  const patches = []
  const appliedBlocks = editorValueToBlocks(
    change.applyOperations([operation]).value.toJSON(VALUE_TO_JSON_OPTS),
    blockContentType
  )

  if (operation.path.length === 1) {
    if (!blocks.length) {
      return set(
        appliedBlocks.map((block, index) => {
          return setKey(change.value.document.nodes.get(index).key, block)
        })
      )
    }
    let position = 'after'
    let afterKey
    if (operation.path[0] === 0) {
      afterKey = blocks[0]._key
      position = 'before'
    } else {
      afterKey = blocks[operation.path[0] - 1]._key
    }
    const newBlock = appliedBlocks[operation.path[0]]
    const newKey = change.value.document.nodes.get(operation.path[0]).key
    setKey(newKey, newBlock)
    const oldData = change.value.document.nodes.get(operation.path[0]).data.toObject()
    if (oldData.value && oldData.value._key) {
      oldData.value._key = newKey
    }
    change.setNodeByKey(newKey, {data: {...oldData, _key: newKey}})
    patches.push(insert([newBlock], position, [{_key: afterKey}]))
  }

  if (operation.path.length > 1) {
    const block = appliedBlocks[operation.path[0]]
    setKey(block._key, block)
    if (block._type === 'block') {
      patches.push(set(normalizeBlock(block), [{_key: block._key}]))
    }
  }
  return patches
}

function splitNodePatch(
  change: Change,
  operation: Operation,
  operations: Operation[],
  blocks: Block[],
  blockContentType
) {
  const patches = []
  const appliedBlocks = editorValueToBlocks(
    change.applyOperations([operation]).value.toJSON(VALUE_TO_JSON_OPTS),
    blockContentType
  )
  const splitBlock = appliedBlocks[operation.path[0]]
  setKey(splitBlock._key, splitBlock)

  if (operation.path.length === 1) {
    patches.push(set(splitBlock, [{_key: splitBlock._key}]))
    const newBlock = appliedBlocks[operation.path[0] + 1]
    const newKey = change.value.document.nodes.get(operation.path[0] + 1).key
    setKey(newKey, newBlock)
    // Update the change value data with new key
    const oldData = change.value.document.nodes.get(operation.path[0] + 1).data.toObject()
    if (oldData.value && oldData.value._key) {
      oldData.value._key = newKey
    }
    change.setNodeByKey(newKey, {data: {...oldData, _key: newKey}})
    patches.push(insert([newBlock], 'after', [{_key: splitBlock._key}]))
  }
  if (operation.path.length > 1) {
    patches.push(set(splitBlock, [{_key: splitBlock._key}]))
  }
  return patches
}

function mergeNodePatch(
  change: Change,
  operation: Operation,
  operations: Operation,
  blocks: Block[],
  blockContentType
) {
  const patches = []
  const appliedBlocks = editorValueToBlocks(
    change.applyOperations([operation]).value.toJSON(VALUE_TO_JSON_OPTS),
    blockContentType
  )
  if (operation.path.length === 1) {
    const mergedBlock = blocks[operation.path[0]]
    const targetBlock = appliedBlocks[operation.path[0] - 1]
    patches.push(
      unset([
        {
          _key: mergedBlock._key
        }
      ])
    )
    patches.push(set(targetBlock, [{_key: blocks[operation.path[0] - 1]._key}]))
  }
  if (operation.path.length > 1) {
    const targetBlock = appliedBlocks[operation.path[0]]
    setKey(targetBlock._key, targetBlock)
    patches.push(set(targetBlock, [{_key: targetBlock._key}]))
  }
  return patches
}

function moveNodePatch(change: Change, operation: Operation, blocks: Block[], blockContentType) {
  change.applyOperations([operation])
  const patches = []
  if (operation.path.length === 1) {
    if (operation.path[0] === operation.newPath[0]) {
      return []
    }
    const block = blocks[operation.path[0]]
    patches.push(
      unset([
        {
          _key: block._key
        }
      ])
    )
    let position = 'after'
    let posKey
    if (operation.newPath[0] === 0) {
      posKey = blocks[0]._key
      position = 'before'
    } else {
      posKey = blocks[operation.newPath[0] - 1]._key
    }
    setKey(block._key, block)
    patches.push(insert([block], position, [{_key: posKey}]))
  } else {
    const appliedBlocks = editorValueToBlocks(
      change.value.toJSON(VALUE_TO_JSON_OPTS),
      blockContentType
    )
    const changedBlockFrom = appliedBlocks[operation.path[0]]
    const changedBlockTo = appliedBlocks[operation.newPath[0]]
    setKey(changedBlockFrom._key, changedBlockFrom)
    setKey(changedBlockTo._key, changedBlockTo)
    patches.push(set(changedBlockFrom, [{_key: changedBlockFrom._key}]))
    patches.push(set(changedBlockTo, [{_key: changedBlockTo._key}]))
  }
  return patches
}

function removeNodePatch(
  change: SlateChange,
  operation: Operation,
  blocks: Block[],
  blockContentType: Type
) {
  change.applyOperations([operation])
  const patches = []
  const block = blocks[operation.path[0]]
  if (operation.path.length === 1) {
    // Unset block
    patches.push(unset([{_key: block._key}]))
  }
  if (operation.path.length > 1) {
    // Only relevant for 'block' type blocks
    if (block._type !== 'block') {
      return patches
    }
    const appliedBlocks = editorValueToBlocks(
      change.value.toJSON(VALUE_TO_JSON_OPTS),
      blockContentType
    )
    const changedBlock = appliedBlocks[operation.path[0]]
    setKey(changedBlock._key, changedBlock)
    patches.push(set(changedBlock, [{_key: changedBlock._key}]))
  }
  if (patches.length === 0) {
    throw new Error(
      `Don't know how to unset ${JSON.stringify(operation.toJSON(VALUE_TO_JSON_OPTS))}`
    )
  }
  return patches
}

function applyPatchesOnValue(patches, value) {
  let _patches = patches
  if (!patches || (Array.isArray(patches) && !patches.length)) {
    return value
  }
  if (!Array.isArray(patches)) {
    _patches = [patches]
  }
  return applyAll(value, _patches)
}

export default function changeToPatches(
  unchangedEditorValue: Value,
  change: Change,
  value: Block[],
  blockContentType: Type
) {
  const {operations} = change
  let blocks = value ? [...value] : []
  const _change = unchangedEditorValue.change()
  const patches = flatten(
    operations
      .map((operation: Operation, index: number) => {
        let _patches
        // console.log('OPERATION:', JSON.stringify(operation.toJSON(), null, 2))
        switch (operation.type) {
          case 'insert_text':
            _patches = setNodePatchSimple(_change, operation, blocks, blockContentType)
            break
          case 'remove_text':
            _patches = setNodePatchSimple(_change, operation, blocks, blockContentType)
            break
          case 'add_mark':
            _patches = setNodePatchSimple(_change, operation, blocks, blockContentType)
            break
          case 'remove_mark':
            _patches = setNodePatchSimple(_change, operation, blocks, blockContentType)
            break
          case 'set_node':
            _patches = setNodePatch(_change, operation, operations, blocks, blockContentType)
            break
          case 'insert_node':
            _patches = insertNodePatch(_change, operation, operations, blocks, blockContentType)
            break
          case 'remove_node':
            _patches = removeNodePatch(_change, operation, blocks, blockContentType)
            break
          case 'split_node':
            _patches = splitNodePatch(_change, operation, operations, blocks, blockContentType)
            break
          case 'merge_node':
            _patches = mergeNodePatch(_change, operation, operations, blocks, blockContentType)
            break
          case 'move_node':
            _patches = moveNodePatch(_change, operation, blocks, blockContentType)
            break
          default:
            _patches = []
        }
        // console.log('BLOCKS BEFORE:', JSON.stringify(blocks, null, 2))
        // console.log('PATCHES:', JSON.stringify(_patches, null, 2))
        blocks = applyPatchesOnValue(_patches, blocks)
        // console.log('BLOCKS AFTER:', JSON.stringify(blocks, null, 2))
        return _patches
      })
      .toArray()
  ).filter(Boolean)
  if (change.__isUndoRedo) {
    patches.push(set({}, [{_key: 'undoRedoVoidPatch'}]))
  }
  return patches
}
