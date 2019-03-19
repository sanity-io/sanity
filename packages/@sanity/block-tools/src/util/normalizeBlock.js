import {isEqual} from 'lodash'
import randomKey from './randomKey'

// Normalizes a block with a complete block structure, and optimizes spans
export default function normalizeBlock(block, blockType) {
  if (!blockType) {
    throw new Error('You must input the block type definition')
  }
  let newIndex = 0
  if (!block._key) {
    block._key = randomKey(12)
  }
  if (block._type !== blockType.name) {
    throw new Error("The input type doesn't match the given block type definition")
  }
  if (!block.children) {
    block.children = []
  }
  if (!block.markDefs) {
    block.markDefs = []
  }
  const lastChild = block.children.slice(-1)[0]
  if (!lastChild) {
    // A block must at least have an empty span type child
    block.children = [
      {
        _type: 'span',
        _key: `${block._key}${0}`,
        text: '',
        marks: []
      }
    ]
    return block
  }
  block.children = block.children
    .filter((child, index) => {
      const previousChild = block.children[index - 1]
      if (
        previousChild &&
        child._type === 'span' &&
        previousChild._type === 'span' &&
        isEqual(previousChild.marks, child.marks)
      ) {
        if (lastChild && lastChild === child && child.text === '' && block.children.length > 1) {
          return false
        }
        previousChild.text += child.text
        return false
      }
      return child
    })
    .map(child => {
      child._key = `${block._key}${newIndex++}`
      if (child._type === 'span' && !child.marks) {
        child.marks = []
      }
      return child
    })
  return block
}
