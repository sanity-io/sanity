import {Block, Data, Document} from 'slate'

function formBuilderNodeOnPaste(formBuilder, editorFields) {

  function getFieldOfType(typeName) {
    return editorFields.find(ofField => ofField.type === typeName)
  }

  function onPaste(event, data, state, editor) {
    if (typeof data.fragment === 'undefined' || data.fragment === null) {
      return null
    }
    const newNodesList = Block.createList(data.fragment.nodes.toArray().map(node => {
      const ofField = getFieldOfType(node.type)
      const value = node.data.get('value')
      if (!value) {
        return node
      }
      const nodeValue = formBuilder.createFieldValue(value, ofField)
      return new Block({
        data: Data.create({value: nodeValue}),
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
