import {PortableTextTextBlock, PortableTextSpan, isPortableTextSpan} from '@sanity/types'
import {isEqual} from 'lodash'
import {TypedObject} from '../types'
import {randomKey} from './randomKey'

/**
 * Block normalization options
 *
 * @public
 */
export interface BlockNormalizationOptions {
  /**
   * Decorator names that are allowed within portable text blocks, eg `em`, `strong`
   */
  allowedDecorators?: string[]

  /**
   * Name of the portable text block type, if not `block`
   */
  blockTypeName?: string
}

/**
 * Normalizes a block by ensuring it has a `_key` property. If the block is a
 * portable text block, additional normalization is applied:
 *
 * - Ensures it has `children` and `markDefs` properties
 * - Ensures it has at least one child (adds an empty span if empty)
 * - Joins sibling spans that has the same marks
 * - Removes decorators that are not allowed according to the schema
 * - Removes marks that have no annotation definition
 *
 * @param node - The block to normalize
 * @param options - Options for normalization process. See {@link BlockNormalizationOptions}
 * @returns Normalized block
 * @public
 */
export function normalizeBlock(
  node: TypedObject,
  options: BlockNormalizationOptions = {}
): Omit<TypedObject | PortableTextTextBlock<TypedObject | PortableTextSpan>, '_key'> & {
  _key: string
} {
  if (node._type !== (options.blockTypeName || 'block')) {
    return '_key' in node ? (node as TypedObject & {_key: string}) : {...node, _key: randomKey(12)}
  }

  const block: Omit<PortableTextTextBlock<TypedObject | PortableTextSpan>, 'style'> = {
    _key: randomKey(12),
    children: [],
    markDefs: [],
    ...node,
  }

  const lastChild = block.children[block.children.length - 1]
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

  const usedMarkDefs: string[] = []
  const allowedDecorators =
    options.allowedDecorators && Array.isArray(options.allowedDecorators)
      ? options.allowedDecorators
      : false

  block.children = block.children
    .reduce((acc, child) => {
      const previousChild = acc[acc.length - 1]
      if (
        previousChild &&
        isPortableTextSpan(child) &&
        isPortableTextSpan(previousChild) &&
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
    }, [] as (TypedObject | PortableTextSpan)[])
    .map((child, index) => {
      if (!child) {
        throw new Error('missing child')
      }

      child._key = `${block._key}${index}`
      if (isPortableTextSpan(child)) {
        if (!child.marks) {
          child.marks = []
        } else if (allowedDecorators) {
          child.marks = child.marks.filter((mark) => {
            const isAllowed = allowedDecorators.includes(mark)
            const isUsed = block.markDefs?.some((def) => def._key === mark)
            return isAllowed || isUsed
          })
        }

        usedMarkDefs.push(...child.marks)
      }

      return child
    })

  // Remove leftover (unused) markDefs
  block.markDefs = (block.markDefs || []).filter((markDef) => usedMarkDefs.includes(markDef._key))
  return block
}
