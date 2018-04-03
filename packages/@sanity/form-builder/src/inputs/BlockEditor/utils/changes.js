import randomKey from './randomKey'

export function setBlockStyle(change, styleName) {
  const {selection, startBlock, endBlock} = change.value
  // If a single block is selected partially, split block conditionally
  // (selection in start, middle or end of text)
  if (
    startBlock === endBlock &&
    selection.isExpanded &&
    !(selection.hasStartAtStartOf(startBlock) && selection.hasEndAtEndOf(startBlock))
  ) {
    const hasTextBefore = !selection.hasStartAtStartOf(startBlock)
    const hasTextAfter = !selection.hasEndAtEndOf(startBlock)
    if (hasTextAfter) {
      const extendForward = selection.isForward
        ? selection.focusOffset - selection.anchorOffset
        : selection.anchorOffset - selection.focusOffset
      change
        .collapseToStart()
        .splitBlock()
        .moveForward()
        .extendForward(extendForward)
        .collapseToEnd()
        .splitBlock()
        .collapseToStartOfPreviousText()
    } else if (hasTextBefore) {
      change
        .collapseToStart()
        .splitBlock()
        .moveForward()
    } else {
      change
        .collapseToEnd()
        .splitBlock()
        .select(selection)
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
  const {focusText, focusOffset} = change.value
  const charsBefore = focusText.characters.slice(0, focusOffset)
  const charsAfter = focusText.characters.slice(focusOffset, -1)
  const isEmpty = obj => obj.get('text').match(/\s/g)
  const whiteSpaceBeforeIndex = charsBefore.reverse().findIndex(obj => isEmpty(obj))

  const newStartOffset = whiteSpaceBeforeIndex > -1 ? charsBefore.size - whiteSpaceBeforeIndex : -1

  const whiteSpaceAfterIndex = charsAfter.findIndex(obj => isEmpty(obj))
  const newEndOffset =
    charsBefore.size + (whiteSpaceAfterIndex > -1 ? whiteSpaceAfterIndex : charsAfter.size + 1)

  // Not near any word, abort
  if (newStartOffset === newEndOffset) {
    return undefined
  }
  // Select and highlight current word
  return change.moveOffsetsTo(newStartOffset, newEndOffset).focus()
}

export function expandToNode(change, node) {
  return change()
    .moveToRangeOf(node)
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
  const block = {
    type: type.name,
    isVoid: true,
    key: key,
    data: {
      _key: key,
      value: {_type: type.name, _key: key}
    }
  }
  change.insertBlock(block)
  return change
}

export function insertInlineObject(change, type) {
  const key = randomKey(12)
  const inline = {
    type: type.name,
    isVoid: true,
    key: key,
    data: {
      _key: key,
      value: {_type: type.name, _key: key}
    }
  }
  change.insertInline(inline)
}
