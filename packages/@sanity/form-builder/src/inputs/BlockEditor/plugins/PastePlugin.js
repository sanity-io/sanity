import blockTools from '@sanity/block-tools'
import {Block, Data, Document} from 'slate'
import {getEventTransfer} from 'slate-react'

function processNode(node, editor) {
  if (!node.get('nodes')) {
    return node
  }

  const newKey = blockTools.randomKey(12)

  const SlateType = node.constructor
  const newData = node.get('data') ? node.get('data').toObject() : {}
  newData._key = newKey
  if (newData.value && newData.value._key) {
    newData.value._key = newKey
  }
  if (newData.annotations) {
    Object.keys(newData.annotations).forEach(key => {
      newData.annotations[key]._key = blockTools.randomKey(12)
    })
  }
  return new SlateType({
    data: Data.create(newData),
    isVoid: editor.query('isVoid', node),
    key: newKey,
    nodes: node.get('nodes').map(childNode => processNode(childNode, editor)),
    type: node.get('type')
  })
}
const NOOP = () => {}
const wait = ms => new Promise(resolve => setTimeout(resolve, ms))

function handleHTML(html, editor, blockContentType, onProgress) {
  return wait(0).then(() => {
    onProgress({status: 'html'})
    const blocks = blockTools.htmlToBlocks(html, blockContentType)
    onProgress({status: 'blocks'})
    const value = blockTools.blocksToEditorValue(blocks, blockContentType)
    const {focusBlock} = editor.value
    value.document.nodes.forEach((block, index) => {
      if (
        index === 0 &&
        focusBlock &&
        !editor.query('isVoid', focusBlock) &&
        focusBlock.nodes.size === 1 &&
        focusBlock.text === ''
      ) {
        editor
          .insertBlock(block)
          .moveToEndOfBlock()
          .removeNodeByKey(focusBlock.key)
      } else {
        editor.insertBlock(block).moveToEndOfBlock()
      }
    })
    onProgress({status: null})
    return editor
  })
}

export default function PastePlugin(options: Options = {}) {
  const {blockContentType} = options
  const onProgress = options.onProgress || NOOP
  if (!blockContentType) {
    throw new Error("Missing required option 'blockContentType'")
  }

  function onPaste(event, editor, next: void => void) {
    event.preventDefault()
    onProgress({status: 'start'})
    const {shiftKey} = event
    const transfer = getEventTransfer(event)
    const {fragment, html} = transfer
    let type = transfer.type
    if (type === 'fragment') {
      onProgress({status: 'fragment'})
      // Check if we have all block types in the schema,
      // otherwise, use html version
      const allSchemaBlockTypes = blockContentType.of
        .map(ofType => ofType.name)
        .concat('contentBlock')
      const allBlocksHasSchemaDef = fragment.nodes
        .map(node => node.type)
        .every(nodeType => allSchemaBlockTypes.includes(nodeType))
      if (allBlocksHasSchemaDef) {
        const {focusBlock} = editor.value
        const newNodesList = Block.createList(fragment.nodes.map(node => processNode(node, editor)))
        const newDoc = new Document({
          key: fragment.key,
          nodes: newNodesList
        })
        newDoc.nodes.forEach((block, index) => {
          if (
            index === 0 &&
            focusBlock &&
            !editor.query('isVoid', focusBlock) &&
            focusBlock.nodes.size === 1 &&
            focusBlock.text === ''
          ) {
            editor
              .insertBlock(block)
              .moveToEndOfBlock()
              .removeNodeByKey(focusBlock.key)
          } else {
            editor.insertBlock(block).moveToEndOfBlock()
          }
        })
        onProgress({status: null})
        return editor
      }
      type = 'html'
    }
    if (type === 'html' && !shiftKey) {
      onProgress({status: 'parsing'})
      handleHTML(html, editor, blockContentType, onProgress).catch(err => {
        onProgress({status: null, error: err})
        throw err
      })
      return true
    }
    onProgress({status: null})
    return next()
  }

  return {
    onPaste
  }
}
