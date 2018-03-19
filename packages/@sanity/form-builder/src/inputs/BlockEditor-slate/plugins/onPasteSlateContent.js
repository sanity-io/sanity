import {Block, Data, Document} from 'slate'
import randomKey from '../util/randomKey'

function formBuilderNodeOnPaste(formBuilder, editorFields) {
  function processNode(node) {
    if (!node.get('nodes')) {
      return node
    }

    const newKey = randomKey(12)

    const SlateType = node.constructor
    const newData = node.get('data') ? node.get('data').toObject() : undefined
    if (newData && newData.value && newData.value._key) {
      newData.value._key = newKey
    }
    return new SlateType({
      data: Data.create(newData),
      isVoid: node.get('isVoid'),
      key: newKey,
      nodes: node.get('nodes').map(processNode),
      type: node.get('type')
    })
  }

  function onPaste(event, data, change) {
    if (typeof data.fragment === 'undefined' || data.fragment === null) {
      return null
    }
    const newNodesList = Block.createList(data.fragment.nodes.toArray().map(processNode))
    const newDoc = new Document({
      key: data.fragment.key,
      nodes: newNodesList
    })
    return change.insertFragment(newDoc)
  }

  return {
    onPaste
  }
}

export default formBuilderNodeOnPaste
