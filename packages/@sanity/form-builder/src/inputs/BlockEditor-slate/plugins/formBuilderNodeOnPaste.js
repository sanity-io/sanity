import {Block, Data, Document} from 'slate'

function formBuilderNodeOnPaste(formBuilder, editorFields) {

  function getFieldOfType(typeName) {
    return editorFields.find(ofField => ofField.type.name === typeName)
  }

  function onPaste(event, data, state, editor) {
    if (typeof data.fragment === 'undefined' || data.fragment === null) {
      return null
    }
    const newNodesList = Block.createList(data.fragment.nodes.toArray().map(node => {
      const ofField = getFieldOfType(node.type)
      // If this is not a formBuilder type, it is a Slate type, and just pass
      // it as it is
      if (!ofField) {
        return node
      }
      // This is a formBuilder type. Clone its structure and value.
      const value = node.data.get('value')
      return new Block({
        data: Data.create({value}),
        isVoid: node.get('isVoid'),
        key: node.get('key'),
        nodes: node.get('nodes'),
        type: node.get('type')
      })
    }))

    const newDoc = new Document({
      key: data.fragment.key,
      nodes: newNodesList
    })

    // Must return state here, so that slate's core plugin onPaste method doesn't kick in!
    return state
      .transform()
      .insertFragment(newDoc)
      .apply()
  }

  return {
    onPaste
  }
}

export default formBuilderNodeOnPaste
