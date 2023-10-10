import type {ArraySchemaType} from '@sanity/types'
import {randomKey} from '../../util/randomKey'
import {isElement, tagName} from '../helpers'
import {
  DEFAULT_BLOCK,
  DEFAULT_SPAN,
  HTML_BLOCK_TAGS,
  HTML_HEADER_TAGS,
  HTML_SPAN_TAGS,
  HTML_LIST_CONTAINER_TAGS,
  HTML_LIST_ITEM_TAGS,
  HTML_DECORATOR_TAGS,
  PartialBlock,
} from '../../constants'
import {BlockEnabledFeatures, DeserializerRule} from '../../types'

export function resolveListItem(
  listNodeTagName: string,
  enabledListTypes: string[],
): string | undefined {
  if (listNodeTagName === 'ul' && enabledListTypes.includes('bullet')) {
    return 'bullet'
  }
  if (listNodeTagName === 'ol' && enabledListTypes.includes('number')) {
    return 'number'
  }
  return undefined
}

export default function createHTMLRules(
  blockContentType: ArraySchemaType,
  options: BlockEnabledFeatures,
): DeserializerRule[] {
  return [
    // Text nodes
    {
      deserialize(el) {
        if (tagName(el) === 'pre') {
          return undefined
        }
        const isValidWhiteSpace =
          el.nodeType === 3 &&
          (el.textContent || '').replace(/[\r\n]/g, ' ').replace(/\s\s+/g, ' ') === ' ' &&
          el.nextSibling &&
          el.nextSibling.nodeType !== 3 &&
          el.previousSibling &&
          el.previousSibling.nodeType !== 3
        const isValidText =
          (isValidWhiteSpace || el.textContent !== ' ') && tagName(el.parentNode) !== 'body'
        if (el.nodeName === '#text' && isValidText) {
          return {
            ...DEFAULT_SPAN,
            marks: [],
            text: (el.textContent || '').replace(/\s\s+/g, ' '),
          }
        }
        return undefined
      },
    }, // Pre element
    {
      deserialize(el) {
        if (tagName(el) !== 'pre') {
          return undefined
        }

        const isCodeEnabled = options.enabledBlockStyles.includes('code')

        return {
          _type: 'block',
          style: 'normal',
          markDefs: [],
          children: [
            {
              ...DEFAULT_SPAN,
              marks: isCodeEnabled ? ['code'] : [],
              text: el.textContent || '',
            },
          ],
        }
      },
    }, // Blockquote element
    {
      deserialize(el, next) {
        if (tagName(el) !== 'blockquote') {
          return undefined
        }
        const blocks: Record<string, PartialBlock | undefined> = {
          ...HTML_BLOCK_TAGS,
          ...HTML_HEADER_TAGS,
        }
        delete blocks.blockquote

        const children: HTMLElement[] = []
        el.childNodes.forEach((node, index) => {
          if (
            node.nodeType === 1 &&
            Object.keys(blocks).includes((node as Element).localName.toLowerCase())
          ) {
            if (!el.ownerDocument) {
              return
            }

            const span = el.ownerDocument.createElement('span')
            span.appendChild(el.ownerDocument.createTextNode('\r'))
            node.childNodes.forEach((cn) => {
              span.appendChild(cn.cloneNode(true))
            })
            if (index !== el.childNodes.length) {
              span.appendChild(el.ownerDocument.createTextNode('\r'))
            }
            children.push(span)
          } else {
            children.push(node as HTMLElement)
          }
        })

        return {
          _type: 'block',
          style: 'blockquote',
          markDefs: [],
          children: next(children),
        }
      },
    }, // Block elements
    {
      deserialize(el, next) {
        const blocks: Record<string, PartialBlock | undefined> = {
          ...HTML_BLOCK_TAGS,
          ...HTML_HEADER_TAGS,
        }
        const tag = tagName(el)
        let block = tag ? blocks[tag] : undefined
        if (!block) {
          return undefined
        }
        // Don't add blocks into list items
        if (el.parentNode && tagName(el.parentNode) === 'li') {
          return next(el.childNodes)
        }
        // If style is not supported, return a defaultBlockType
        if (!options.enabledBlockStyles.includes(block.style)) {
          block = DEFAULT_BLOCK
        }
        return {
          ...block,
          children: next(el.childNodes),
        }
      },
    }, // Ignore span tags
    {
      deserialize(el, next) {
        const tag = tagName(el)
        if (!tag || !(tag in HTML_SPAN_TAGS)) {
          return undefined
        }
        return next(el.childNodes)
      },
    }, // Ignore div tags
    {
      deserialize(el, next) {
        const div = tagName(el) === 'div'
        if (!div) {
          return undefined
        }
        return next(el.childNodes)
      },
    }, // Ignore list containers
    {
      deserialize(el, next) {
        const tag = tagName(el)
        if (!tag || !(tag in HTML_LIST_CONTAINER_TAGS)) {
          return undefined
        }
        return next(el.childNodes)
      },
    }, // Deal with br's
    {
      deserialize(el) {
        if (tagName(el) === 'br') {
          return {
            ...DEFAULT_SPAN,
            text: '\n',
          }
        }
        return undefined
      },
    }, // Deal with list items
    {
      deserialize(el, next, block) {
        const tag = tagName(el)
        const listItem = tag ? HTML_LIST_ITEM_TAGS[tag] : undefined
        const parentTag = tagName(el.parentNode) || ''
        if (!listItem || !el.parentNode || !HTML_LIST_CONTAINER_TAGS[parentTag]) {
          return undefined
        }
        const enabledListItem = resolveListItem(parentTag, options.enabledListTypes)
        // If the list item style is not supported, return a new default block
        if (!enabledListItem) {
          return block({_type: 'block', children: next(el.childNodes)})
        }
        listItem.listItem = enabledListItem
        return {
          ...listItem,
          children: next(el.childNodes),
        }
      },
    }, // Deal with decorators - this is a limited set of known html elements that we know how to deserialize
    {
      deserialize(el, next) {
        const decorator = HTML_DECORATOR_TAGS[tagName(el) || '']
        if (!decorator || !options.enabledSpanDecorators.includes(decorator)) {
          return undefined
        }
        return {
          _type: '__decorator',
          name: decorator,
          children: next(el.childNodes),
        }
      },
    }, // Special case for hyperlinks, add annotation (if allowed by schema),
    // If not supported just write out the link text and href in plain text.
    {
      deserialize(el, next) {
        if (tagName(el) != 'a') {
          return undefined
        }
        const linkEnabled = options.enabledBlockAnnotations.includes('link')
        const href = isElement(el) && el.getAttribute('href')
        if (!href) {
          return next(el.childNodes)
        }
        let markDef
        if (linkEnabled) {
          markDef = {
            _key: randomKey(12),
            _type: 'link',
            href: href,
          }
          return {
            _type: '__annotation',
            markDef: markDef,
            children: next(el.childNodes),
          }
        }
        return el.appendChild(el.ownerDocument.createTextNode(` (${href})`)) && next(el.childNodes)
      },
    },
  ]
}
