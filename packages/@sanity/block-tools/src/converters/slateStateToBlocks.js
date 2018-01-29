// @flow

import {get, flatten} from 'lodash'
import randomKey from '../util/randomKey'

function toSanitySpan(node, sanityBlock, spanIndex) {
  if (node.kind === 'text') {
    return node.ranges
      .map(range => {
        return {
          _type: 'span',
          _key: `${sanityBlock._key}${spanIndex()}`,
          text: range.text,
          marks: range.marks.map(mark => mark.type)
        }
      })
  }
  if (node.kind === 'inline') {
    const {nodes, data} = node
    return flatten(nodes.map(nodesNode => {
      if (nodesNode.kind !== 'text') {
        throw new Error(`Unexpected non-text child node for inline text: ${nodesNode.kind}`)
      }
      if (node.type !== 'span') {
        return node.data.value
      }
      const annotations = data.annotations
      const annotationKeys = []
      if (annotations) {
        Object.keys(annotations).forEach(name => {
          const annotation = annotations[name]
          const annotationKey = annotation._key
          if (annotation && annotationKey) {
            sanityBlock.markDefs.push(annotation)
            annotationKeys.push(annotationKey)
          }
        })
      }
      return nodesNode.ranges
        .map(range => ({
          _type: 'span',
          _key: `${sanityBlock._key}${spanIndex()}`,
          text: range.text,
          marks: range.marks.map(mark => mark.type).concat(annotationKeys),
        }))
    }))
  }
  throw new Error(`Unsupported kind ${node.kind}`)
}

function toSanityBlock(block) {
  if (block.type === 'contentBlock') {
    const sanityBlock = {
      ...block.data,
      _type: 'block',
      _key: block.key || block.data._key || randomKey(12),
      markDefs: []
    }
    let index = 0
    const spanIndex = () => {
      return index++
    }
    sanityBlock.children = flatten(block.nodes.map(node => {
      return toSanitySpan(node, sanityBlock, spanIndex)
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
