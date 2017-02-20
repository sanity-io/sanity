// Converts a persisted array to a slate compatible json document
import {get, flatten} from 'lodash'

function toSanitySpan(blockNode) {
  if (blockNode.kind === 'text') {
    return blockNode.ranges
      .map(range => {
        return {
          _type: 'span',
          text: range.text,
          marks: range.marks.map(mark => mark.type)
        }
      })
  }
  if (blockNode.kind === 'inline') {
    const {nodes, data} = blockNode
    return flatten(nodes.map(node => {
      if (node.kind !== 'text') {
        throw new Error(`Unexpected non-text child node for inline text: ${node.kind}`)
      }
      return node.ranges
        .map(range => ({
          _type: 'span',
          text: range.text,
          marks: range.marks.map(mark => mark.type),
          ...data.value
        }))
    }))
  }
  throw new Error(`Unsupported kind ${blockNode.kind}`)
}

function toSanityBlock(block) {
  // debugger
  if (block.type === 'contentBlock') {
    return {
      ...block.data,
      _type: 'block',
      spans: flatten(block.nodes.map(toSanitySpan))
    }
  }
  return block.data.value
}

function isEmpty(blocks) {
  if (blocks.length === 0) {
    return true
  }
  if (blocks.length > 1) {
    return false
  }
  const firstBlock = blocks[0]
  if (firstBlock._type !== 'block') {
    return false
  }
  const spans = firstBlock.spans
  if (spans.length === 0) {
    return true
  }
  if (spans.length > 1) {
    return false
  }
  const firstSpan = spans[0]
  if (firstSpan._type !== 'span') {
    return false
  }
  return firstSpan.text.length === 0
}

export default function slateRawToSanity(raw) {
  const nodes = get(raw, 'document.nodes')
  if (!nodes || nodes.length === 0) {
    return undefined
  }
  const blocks = nodes.map(toSanityBlock)
  return isEmpty(blocks) ? undefined : blocks
}
