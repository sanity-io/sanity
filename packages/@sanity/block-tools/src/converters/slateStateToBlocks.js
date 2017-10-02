// @flow

import {get, flatten} from 'lodash'

function toSanitySpan(blockNode, sanityBlock) {
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
      if (blockNode.type !== 'span') {
        return blockNode.data.value
      }
      const annotations = data.annotations
      const annotationKeys = []
      if (annotations) {
        Object.keys(annotations).forEach(name => {
          const annotation = annotations[name]
          const annotationKey = annotation._key
          sanityBlock.markDefs.push(annotation)
          annotationKeys.push(annotationKey)
        })
      }
      return node.ranges
        .map(range => ({
          _type: 'span',
          text: range.text,
          marks: range.marks.map(mark => mark.type).concat(annotationKeys),
        }))
    }))
  }
  throw new Error(`Unsupported kind ${blockNode.kind}`)
}

function toSanityBlock(block) {
  if (block.type === 'contentBlock') {
    const sanityBlock = {
      ...block.data,
      _type: 'block',
      markDefs: block.data.markDefs || []
    }
    sanityBlock.children = flatten(block.nodes.map(node => {
      return toSanitySpan(node, sanityBlock)
    }))
    return sanityBlock
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
  const children = firstBlock.children
  if (children.length === 0) {
    return true
  }
  if (children.length > 1) {
    return false
  }
  const firstChild = children[0]
  if (firstChild._type !== 'span') {
    return false
  }
  return firstChild.text.length === 0
}

export default function slateStateToBlocks(json) {
  const nodes = get(json, 'document.nodes')
  if (!nodes || nodes.length === 0) {
    return undefined
  }
  const blocks = nodes.map(toSanityBlock).filter(Boolean)
  return isEmpty(blocks) ? undefined : blocks
}
