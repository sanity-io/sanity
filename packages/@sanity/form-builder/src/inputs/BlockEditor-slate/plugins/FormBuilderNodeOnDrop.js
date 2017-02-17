// This plugin is responsible for preparing data
// from a drag event onto the editor nodes

function onDrop(event, data, state, editor) {

  if (data.type !== 'node') {
    return null
  }

  let {target} = data
  const {isInternal, node} = data
  let {selection} = state
  if (isInternal) {
    // Dragging of texts inernally in the document
    // Let Slate deal with that.
    data.type = 'fragment'
    data.isInternal = true
    data.fragment = state.document.getFragmentAtRange(selection)
    return null
  }

  // Not a Slate node, not our problem
  if (!['block', 'inline'].includes(node.kind)) {
    return null
  }

  // Dragging of something from the outside onto a editor node
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
  }

  return transform.apply()

}

function formBuilderNodeOnDrop() {
  return {
    onDrop
  }
}

export default formBuilderNodeOnDrop
