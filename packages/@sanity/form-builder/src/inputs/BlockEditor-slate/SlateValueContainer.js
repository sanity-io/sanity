import {Raw} from 'slate'
import {ParagraphAccessor, SpansAccessor} from './accessors'
import {sanityBlockArrayToSlateDocument, sanityBlockNodeToSlateRaw} from './conversion'

const EMPTY_CONTENT = [{_key: 'first', _type: 'paragraph', nodes: []}]

// SlateValueContainer wraps a Slate native 'document' value and presents it through the accessor interface as
// if it was still in the Sanity format. This works deeply into the document structure through the value accessors in
// ./accessors.js
export default class SlateValueContainer {
  // Create a SlateValueContainer based on a document encoded as a Sanity value
  static deserialize(content, context) {
    const doc = sanityBlockArrayToSlateDocument((content && content.length) > 0 ? content : EMPTY_CONTENT)
    return new SlateValueContainer(doc, context)
  }

  // Wraps a SlateValueContainer around the document content as encoded in the native format of Slate
  constructor(document, context) {
    this.document = document
    this.context = context
  }

  toJSON() {
    return this.serialize()
  }

  // Converts the contained document back from the Slate internal format to Sanity encoding
  serialize() {
    const length = this.length()
    const result = []
    for (let i = 0; i < length; i++) {
      result.push(this.getIndex(i).serialize())
    }
    return result
  }

  isEmpty() {
    return this.length() === 0
  }

  containerType() {
    return 'array'
  }

  setIndex(index, item) {
    const nextDocument = this.document.setIn(['nodes', index], Raw.deserializeNode(sanityBlockNodeToSlateRaw(item)))
    return new SlateValueContainer(nextDocument, this.context)
  }

  setIndexAccessor(index, accessor) {
    return new SlateValueContainer(this.document.setIn(['nodes', index], accessor.get()), this.context)
  }

  unsetIndices(indices) {
    if (indices.length === 0) {
      return this
    }

    const nodes = this.document.nodes
    const nextNodes = nodes.filterNot((node, index) => indices.includes(index))

    return new SlateValueContainer(this.document.set('nodes', nextNodes), this.context)
  }

  insertItemsAt(pos, jsonNodes) {
    const insertNodes = jsonNodes.map(node => Raw.deserializeNode(nodeToRaw(node)))

    if (this.isEmpty()) {
      return SlateValueContainer.deserialize(insertNodes, this.context)
    }

    const nodes = this.document.nodes
    const nextNodes = nodes.slice(0, pos).concat(insertNodes).concat(nodes.slice(pos))
    return new SlateValueContainer(this.document.set('nodes', nextNodes))
  }

  length() {
    return this.document.get('nodes').size
  }

  getIndex(index) {
    const node = this.document.getIn(['nodes', index])
    switch (node.type) {
      case 'paragraph': {
        return new ParagraphAccessor(node)
      }
      default: {
        throw new Error(`Unsupported block node ${node.type}`)
      }
    }
  }

  set(nextValue) {
    return SlateValueContainer.deserialize(nextValue, this.context)
  }

  get() {
    return this.serialize()
  }
}
