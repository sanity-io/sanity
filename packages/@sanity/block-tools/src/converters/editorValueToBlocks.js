// @flow

import {get, flatten} from 'lodash'
import randomKey from '../util/randomKey'
import normalizeBlock from '../util/normalizeBlock'
import {BLOCK_DEFAULT_STYLE} from '../constants'

function createCustomBlockFromData(block) {
  const {value} = block.data
  if (!value) {
    throw new Error(`Data got no value: ${JSON.stringify(block.data)}`)
  }
  const finalBlock = {...value}
  finalBlock._key = block.data._key || randomKey(12)
  if (!finalBlock._type) {
    throw new Error(`The block must have a _type: ${JSON.stringify(value)}`)
  }
  return finalBlock
}

function toSanitySpan(node, sanityBlock, spanIndex) {
  if (node.object === 'text') {
    return node.leaves.map(leaf => {
      return {
        _type: 'span',
        _key: `${sanityBlock._key}${spanIndex()}`,
        text: leaf.text,
        marks: leaf.marks.map(mark => mark.type)
      }
    })
  }
  if (node.object === 'inline') {
    const {nodes, data} = node
    return flatten(
      nodes.map(nodesNode => {
        if (nodesNode.object !== 'text') {
          throw new Error(`Unexpected non-text child node for inline text: ${nodesNode.object}`)
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
        return nodesNode.leaves.map(leaf => ({
          _type: 'span',
          _key: `${sanityBlock._key}${spanIndex()}`,
          text: leaf.text,
          marks: leaf.marks.map(mark => mark.type).concat(annotationKeys)
        }))
      })
    )
  }
  throw new Error(`Unsupported object ${node.object}`)
}

function toSanityBlock(block, options = {}) {
  if (block.type === 'contentBlock') {
    const sanityBlock = {
      ...block.data,
      _type: 'block',
      markDefs: []
    }
    let index = 0
    const spanIndex = () => {
      return index++
    }
    // if (!sanityBlock._key) {
    //   throw new Error('Block got no key!')
    // }
    if (!sanityBlock._key) {
      sanityBlock._key = sanityBlock.key || randomKey(12)
    }
    if (!sanityBlock.style) {
      sanityBlock.style = BLOCK_DEFAULT_STYLE
    }
    sanityBlock.children = flatten(
      block.nodes.map(node => toSanitySpan(node, sanityBlock, spanIndex))
    )
    return options.normalize ? normalizeBlock(sanityBlock) : sanityBlock
  }
  return createCustomBlockFromData(block)
}

export default function editorValueToBlocks(value: {}, options = {}) {
  const nodes = get(value, 'document.nodes')
  if (!nodes || nodes.length === 0) {
    return []
  }
  return nodes.map(node => toSanityBlock(node, options)).filter(Boolean)
}
