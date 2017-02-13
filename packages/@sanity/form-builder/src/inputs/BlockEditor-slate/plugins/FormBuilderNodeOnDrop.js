// This plugin is responsible for dragging

function onDrop(event, data, state, editor) {

  if (data.type !== 'node') {
    return null
  }

  let {target} = data
  const {isInternal, node} = data
  let {selection} = state
  if (isInternal) {
    // Dragging of texts inernally in the document
    data.type = 'fragment'
    data.isInternal = true
    data.fragment = state.document.getFragmentAtRange(selection)
  } else {
    // Dragging of something from the outside
    selection = selection.moveToRangeOf(state.document.getChild(node.key))

    if (
      selection.endKey == target.endKey
        && selection.endOffset < target.endOffset
    ) {
      target = target.moveBackward(selection.startKey == selection.endKey
        ? selection.endOffset - selection.startOffset
        : selection.endOffset)
    }

    let transform = state.transform()
      .removeNodeByKey(node.key)
      .moveTo(target)

    if (node.kind === 'block') {
      transform = transform.insertBlock(node)
    } else if (node.kind === 'inline') {
      transform = transform.insertInline(node)
    } else {
      return null
    }
    return transform.apply()
  }
}

function FormBuilderNodeOnDrop(...args) {
  return {
    onDrop
  }
}

export default FormBuilderNodeOnDrop
