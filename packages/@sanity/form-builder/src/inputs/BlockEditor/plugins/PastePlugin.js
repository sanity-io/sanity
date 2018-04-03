import {Block, Data, Document} from 'slate'
import {getEventTransfer} from 'slate-react'
import blockTools from '@sanity/block-tools'
import randomKey from '../utils/randomKey'

function processNode(node) {
  if (!node.get('nodes')) {
    return node
  }

  const newKey = randomKey(12)

  const SlateType = node.constructor
  const newData = node.get('data') ? node.get('data').toObject() : {}
  newData._key = newKey
  if (newData.value && newData.value._key) {
    newData.value._key = newKey
  }
  if (newData.annotations) {
    Object.keys(newData.annotations).forEach(key => {
      newData.annotations[key]._key = randomKey(12)
    })
  }
  return new SlateType({
    data: Data.create(newData),
    isVoid: node.get('isVoid'),
    key: newKey,
    nodes: node.get('nodes').map(processNode),
    type: node.get('type')
  })
}

export default function PastePlugin(options: Options = {}) {
  const {blockContentType} = options
  if (!blockContentType) {
    throw new Error("Missing required option 'blockContentType'")
  }

  function onPaste(event, change, editor) {
    event.preventDefault()
    const {shiftKey} = event
    const transfer = getEventTransfer(event)
    const {type, fragment, html} = transfer
    if (type === 'fragment') {
      const newNodesList = Block.createList(fragment.nodes.map(processNode))
      const newDoc = new Document({
        key: fragment.key,
        nodes: newNodesList
      })
      return change.insertFragment(newDoc)
    }
    if (type === 'html' && !shiftKey) {
      const blocks = blockTools.htmlToBlocks(html, blockContentType)
      const {document} = blockTools.blocksToEditorValue(blocks, blockContentType)
      return change.insertFragment(Document.fromJSON(document))
    }
    return undefined
  }

  return {
    onPaste
  }
}
