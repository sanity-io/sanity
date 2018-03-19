import {isEqual} from 'lodash'

// For a block with _type 'block' (text), join spans where possible
export default function normalizeBlock(block) {
  let newIndex = 0
  if (block._type !== 'block') {
    return block
  }
  if (!block.children) {
    block.children = []
  }
  const lastChild = block.children.slice(-1)[0]
  block.children = block.children
    .filter((child, index) => {
      const previousChild = block.children[index - 1]
      if (
        previousChild &&
        child._type === 'span' &&
        previousChild._type === 'span' &&
        isEqual(previousChild.marks, child.marks)
      ) {
        if (
          lastChild &&
          lastChild._key === child._key &&
          child.text === '' &&
          block.children.length > 1
        ) {
          return false
        }
        previousChild.text += child.text
        return false
      }
      return child
    })
    .map(child => {
      child._key = `${block._key}${newIndex++}`
      return child
    })
  return block
}
