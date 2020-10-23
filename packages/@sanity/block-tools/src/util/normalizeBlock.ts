import {isEqual} from 'lodash'
import randomKey from './randomKey'

// For a block with _type 'block' (text), join spans where possible
export default function normalizeBlock(
  block,
  options: {allowedDecorators?: string[]; blockTypeName?: string} = {}
) {
  let newIndex = 0
  if (!block._key) {
    block._key = randomKey(12)
  }
  if (block._type !== (options.blockTypeName || 'block')) {
    return block
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
        marks: [],
      },
    ]
    return block
  }
  let usedMarkDefs = []
  const allowedDecorators =
    options.allowedDecorators &&
    Array.isArray(options.allowedDecorators) &&
    options.allowedDecorators
  block.children = block.children
    .reduce((acc, child) => {
      const previousChild = acc.slice(-1)[0]
      if (
        previousChild &&
        child._type === 'span' &&
        previousChild._type === 'span' &&
        isEqual(previousChild.marks, child.marks)
      ) {
        if (lastChild && lastChild === child && child.text === '' && block.children.length > 1) {
          return acc
        }
        previousChild.text += child.text
        return acc
      }
      acc.push(child)
      return acc
    }, [])
    .map((child) => {
      child._key = `${block._key}${newIndex++}`
      if (child._type === 'span' && !child.marks) {
        child.marks = []
      }
      if (allowedDecorators && child._type === 'span') {
        child.marks = child.marks.filter(
          (mark) => allowedDecorators.includes(mark) || block.markDefs.find((def) => def._key)
        )
      }
      usedMarkDefs = usedMarkDefs.concat(child.marks)
      return child
    })
  // Remove leftover markDefs
  block.markDefs = block.markDefs.filter((markDef) => usedMarkDefs.includes(markDef._key))
  return block
}
