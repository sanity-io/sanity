import {Block} from 'slate'
import {editorValueToBlocks, blocksToEditorValue} from '@sanity/block-tools'
import randomKey from './randomKey'
import {VALUE_TO_JSON_OPTS} from './changeToPatches'

// eslint-disable-next-line complexity
export function setBlockStyle(change, styleName) {
  const {selection, startBlock, endBlock} = change.value
  // If a single block is selected partially, split block conditionally
  // (selection in start, middle or end of text)
  if (
    startBlock === endBlock &&
    selection.isExpanded &&
    !(selection.start.isAtStartOfNode(startBlock) && selection.end.isAtEndOfNode(startBlock))
  ) {
    const hasTextBefore = !selection.start.isAtStartOfNode(startBlock)
    const hasTextAfter = !selection.end.isAtEndOfNode(startBlock)
    const move = selection.isForward
      ? selection.focus.offset - selection.anchor.offset
      : selection.anchor.offset - selection.focus.offset

    if (hasTextAfter && !hasTextBefore) {
      change
        .moveToStart()
        .moveForward(move)
        .moveToEnd()
        .splitBlock()
        .moveToStartOfPreviousText()
    } else if (hasTextBefore && !hasTextAfter) {
      change
        .moveToEnd()
        .moveBackward(move)
        .moveToEnd()
        .splitBlock()
        .moveToEnd()
    } else {
      change[selection.isForward ? 'moveToAnchor' : 'moveToFocus']()
        .splitBlock()
        .moveForward(move)
        .splitBlock()
        .moveToStartOfPreviousBlock()
    }
  }
  // Do the actual style transform, only acting on type contentBlock
  change.value.blocks.forEach(blk => {
    const newData = {...blk.data.toObject(), style: styleName}
    if (blk.type === 'contentBlock') {
      change.setNodeByKey(blk.key, {data: newData})
    }
  })
  change.focus()
  return change
}

export function toggleMark(change, mark, editor) {
  change.toggleMark(mark)
  change.focus()
  return change
}

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

export function expandToFocusedWord(change) {
  const {focusText, selection} = change.value
  const {focus} = selection
  const focusOffset = focus.offset
  const charsBefore = focusText.text.slice(0, focusOffset)
  const charsAfter = focusText.text.slice(focusOffset, -1)
  const isEmpty = str => str.match(/\s/g)
  const whiteSpaceBeforeIndex = charsBefore
    .split('')
    .reverse()
    .findIndex(str => isEmpty(str))

  const newStartOffset =
    whiteSpaceBeforeIndex > -1 ? charsBefore.length - whiteSpaceBeforeIndex : -1

  const whiteSpaceAfterIndex = charsAfter.split('').findIndex(obj => isEmpty(obj))
  const newEndOffset =
    charsBefore.length + (whiteSpaceAfterIndex > -1 ? whiteSpaceAfterIndex : charsAfter.length + 1)

  // Not near any word, abort
  if (newStartOffset === newEndOffset || (isNaN(newStartOffset) || isNaN(newEndOffset))) {
    return undefined
  }
  // Select and highlight current word
  return change
    .moveAnchorTo(newStartOffset)
    .moveFocusTo(newEndOffset)
    .focus()
}

export function expandToNode(change, node) {
  return change()
    .moveToRangeOfNode(node)
    .focus()
}

export function removeSpan(change, spanNode) {
  if (Array.isArray(spanNode)) {
    spanNode.forEach(node => {
      change.unwrapInlineByKey(node.key)
    })
    change.focus()
  } else if (spanNode) {
    change.unwrapInlineByKey(spanNode.key).focus()
  } else {
    // Apply on current selection
    change.unwrapInline('span').focus()
  }
  return change
}

export function createFormBuilderSpan(change, annotationName, key, originalSelection) {
  const {value} = change
  const {selection} = value
  if (!selection.isExpanded) {
    expandToFocusedWord(change)
  }
  const span = {
    isVoid: false,
    type: 'span',
    object: 'inline',
    data: undefined,
    key: key
  }
  change.unwrapInline('span').wrapInline(span)

  const currentSpan = value.inlines.filter(inline => inline.key === key).first()

  const data = {
    annotations: currentSpan ? currentSpan.data.get('annotations') || {} : {},
    focusedAnnotationName: annotationName,
    originalSelection: originalSelection
  }
  data.annotations[annotationName] = {
    _type: annotationName,
    _key: key
  }
  change.setInlines({data: data})
  return change
}

export function removeAnnotationFromSpan(change, spanNode, annotationType) {
  const annotations = spanNode.data.get('annotations')
  if (!annotations) {
    return undefined
  }
  // Remove the whole span if this annotation is the only one left
  if (Object.keys(annotations).length === 1 && annotations[annotationType]) {
    const originalSelection = spanNode.data.get('originalSelection')
    change.call(removeSpan, spanNode)
    if (originalSelection) {
      change.select(originalSelection)
    }
    change.focus()
    return change
  }
  // If several annotations, remove only this one and leave the span node intact
  Object.keys(annotations).forEach(name => {
    if (annotations[name]._type === annotationType) {
      delete annotations[name]
    }
  })
  const data = {
    ...spanNode.data.toObject(),
    focusedAnnotationName: undefined,
    annotations: annotations,
    originalSelection: undefined
  }
  change.setNodeByKey(spanNode.key, {data})
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
