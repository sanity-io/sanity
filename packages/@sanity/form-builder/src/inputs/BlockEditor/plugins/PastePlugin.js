import blockTools from '@sanity/block-tools'
import {Block, Data, Document} from 'slate'
import {getEventTransfer} from 'slate-react'
import deserialize from '../utils/deserialize'
import buildEditorSchema from '../utils/buildEditorSchema'
import createEditorController from '../utils/createEditorController'

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

function handleHTML(html, editor, blockContentType, onProgress, pasteController) {
  return wait(100).then(() => {
    onProgress({status: 'html'})
    const blocks = blockTools.htmlToBlocks(html, blockContentType)
    onProgress({status: 'blocks'})
    const value = deserialize(blocks, blockContentType)
    pasteController.setValue(value)
    editor.insertFragment(pasteController.value.document)
    pasteController.setValue(deserialize(null, blockContentType))
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

  const editorSchema = buildEditorSchema(options.blockContentFeatures)
  const controllerOpts = {
    plugins: [
      {
        schema: editorSchema
      }
    ]
  }
  const pasteController = createEditorController(controllerOpts)

  function onPaste(event, editor, next: void => void) {
    event.preventDefault()
    onProgress({status: 'start'})
    const transfer = getEventTransfer(event)
    const {fragment, html, text} = transfer
    const {type} = transfer
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
    }
    onProgress({status: 'parsing'})
    if (!text && !html) {
      onProgress({status: null})
      return true
    }
    handleHTML(
      html || `<html><body>${text.split('\n').map(line => `<p>${line}</p>`)}</body></html>`,
      editor,
      blockContentType,
      onProgress,
      pasteController
    ).catch(err => {
      onProgress({status: null, error: err})
      throw err
    })
    return true
  }

  return {
    onPaste
  }
}
