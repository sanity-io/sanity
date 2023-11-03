import type {ArraySchemaType} from '@sanity/types'
import type {BlockEnabledFeatures, DeserializerRule} from '../../types'
import {
  BLOCK_DEFAULT_STYLE,
  DEFAULT_BLOCK,
  DEFAULT_SPAN,
  HTML_BLOCK_TAGS,
  HTML_HEADER_TAGS,
  HTML_LIST_CONTAINER_TAGS,
} from '../../constants'
import {isElement, tagName} from '../helpers'

const LIST_CONTAINER_TAGS = Object.keys(HTML_LIST_CONTAINER_TAGS)

// font-style:italic seems like the most important rule for italic / emphasis in their html
function isEmphasis(el: Node): boolean {
  const style = isElement(el) && el.getAttribute('style')
  return /font-style:italic/.test(style || '')
}

// font-weight:700 seems like the most important rule for bold in their html
function isStrong(el: Node): boolean {
  const style = isElement(el) && el.getAttribute('style')
  return /font-weight:700/.test(style || '')
}

// Check for attribute given by the gdocs preprocessor
function isGoogleDocs(el: Node): boolean {
  return isElement(el) && Boolean(el.getAttribute('data-is-google-docs'))
}

function getListItemStyle(el: Node): 'bullet' | 'number' | undefined {
  const parentTag = tagName(el.parentNode)
  if (parentTag && !LIST_CONTAINER_TAGS.includes(parentTag)) {
    return undefined
  }
  return tagName(el.parentNode) === 'ul' ? 'bullet' : 'number'
}

function getListItemLevel(el: Node): number {
  let level = 0
  if (tagName(el) === 'li') {
    let parentNode = el.parentNode
    while (parentNode) {
      const parentTag = tagName(parentNode)
      if (parentTag && LIST_CONTAINER_TAGS.includes(parentTag)) {
        level++
      }
      parentNode = parentNode.parentNode
    }
  } else {
    level = 1
  }
  return level
}

const blocks: Record<string, {style: string} | undefined> = {
  ...HTML_BLOCK_TAGS,
  ...HTML_HEADER_TAGS,
}

function getBlockStyle(el: Node, enabledBlockStyles: string[]): string {
  const childTag = tagName(el.firstChild)
  const block = childTag && blocks[childTag]
  if (!block) {
    return BLOCK_DEFAULT_STYLE
  }
  if (!enabledBlockStyles.includes(block.style)) {
    return BLOCK_DEFAULT_STYLE
  }
  return block.style
}

export default function createGDocsRules(
  _blockContentType: ArraySchemaType,
  options: BlockEnabledFeatures,
): DeserializerRule[] {
  return [
    {
      deserialize(el) {
        if (isElement(el) && tagName(el) === 'span' && isGoogleDocs(el)) {
          const span = {
            ...DEFAULT_SPAN,
            marks: [] as string[],
            text: el.textContent,
          }
          if (isStrong(el)) {
            span.marks.push('strong')
          }
          if (isEmphasis(el)) {
            span.marks.push('em')
          }
          return span
        }
        return undefined
      },
    },
    {
      deserialize(el, next) {
        if (tagName(el) === 'li' && isGoogleDocs(el)) {
          return {
            ...DEFAULT_BLOCK,
            listItem: getListItemStyle(el),
            level: getListItemLevel(el),
            style: getBlockStyle(el, options.enabledBlockStyles),
            children: next(el.firstChild?.childNodes || []),
          }
        }
        return undefined
      },
    },
  ]
}
