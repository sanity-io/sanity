import {Block} from 'slate'
import {randomKey, editorValueToBlocks, blocksToEditorValue} from '@sanity/block-tools'
import {VALUE_TO_JSON_OPTS} from './changeToPatches'

export function toggleListItem(change, listItemName) {
  const {blocks} = change.value
  if (blocks.length === 0) {
    return change
  }
  const active = blocks.some(block => block.data.get('listItem') === listItemName)
  blocks.forEach(block => {
    const data = block.data ? block.data.toObject() : {}
    if (active) {
      delete data.listItem
    } else {
      data.listItem = listItemName
      data.level = data.level || 1
    }
    change.setNodeByKey(block.key, {data: data})
  })
  change.focus()
  return change
}

export function insertBlockObject(change, type) {
  const key = randomKey(12)
  const block = Block.create({
    type: type.name,
    isVoid: true,
    key: key,
    data: {
      _key: key,
      value: {_type: type.name, _key: key}
    }
  })
  const {focusBlock} = change.value
  // If the focusBlock is not void and empty, replace it with the block to insert
  if (
    focusBlock &&
    !change.value.schema.isVoid(focusBlock) &&
    focusBlock.nodes.size === 1 &&
    focusBlock.text === ''
  ) {
    change.replaceNodeByKey(focusBlock.key, block).moveTo(block.key, 0)
    return change
  }
  change.insertBlock(block).moveToEndOfBlock()
  return change
}

export function insertInlineObject(change, objectType, blockContentType) {
  const key = randomKey(12)
  const inline = {
    type: objectType.name,
    isVoid: true,
    key: key,
    data: {
      _key: key,
      value: {_type: objectType.name, _key: key, _oldKey: key}
    }
  }
  change.insertInline(inline)
  const {value} = change
  const {focusBlock} = value
  const appliedBlocks = editorValueToBlocks(
    {document: {nodes: [focusBlock.toJSON(VALUE_TO_JSON_OPTS)]}},
    blockContentType
  )
  const newBlock = Block.fromJSON(
    blocksToEditorValue(appliedBlocks, blockContentType).document.nodes[0]
  )
  const inlineObject = newBlock.nodes.find(
    node => node.data && node.data.get('value') && node.data.get('value')._oldKey === key
  )
  const newData = inlineObject.data.toObject()
  delete newData.value._oldKey
  change.replaceNodeByKey(focusBlock.key, newBlock.toJSON(VALUE_TO_JSON_OPTS))
  change.setNodeByKey(inlineObject.key, {data: newData})
  change.moveToEndOfNode(inlineObject)
  return change
}
