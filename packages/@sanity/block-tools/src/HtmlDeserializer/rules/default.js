import randomKey from '../../util/randomKey'
import {
  DEFAULT_BLOCK,
  DEFAULT_SPAN,
  HTML_BLOCK_TAGS,
  HTML_HEADER_TAGS,
  HTML_SPAN_TAGS,
  HTML_LIST_CONTAINER_TAGS,
  HTML_LIST_ITEM_TAGS,
  HTML_DECORATOR_TAGS
} from '../../constants'
import {tagName} from '../helpers'

export function resolveListItem(listNodeTagName) {
  let listStyle
  switch (listNodeTagName) {
    case 'ul':
      listStyle = 'bullet'
      break
    case 'ol':
      listStyle = 'number'
      break
    default:
      listStyle = 'bullet'
  }
  return listStyle
}

export default function createDefaultRules(blockContentType, options = {}) {
  return [
    // Text nodes
    {
      deserialize(el) {
        const isValidText = el.textContent !== ' ' && tagName(el.parentNode) !== 'body'
        if (el.nodeName === '#text' && isValidText) {
          return {
            ...DEFAULT_SPAN,
            marks: [],
            text: el.value || el.nodeValue
          }
        }
        return undefined
      }
    },

    // Blockquote element
    {
      deserialize(el, next) {
        if (tagName(el) !== 'blockquote') {
          return undefined
        }
        const blocks = {...HTML_BLOCK_TAGS, ...HTML_HEADER_TAGS}
        delete blocks.blockquote
        const children = []
        el.childNodes.forEach((node, index) => {
          if (node.nodeType === 1 && Object.keys(blocks).includes(node.localName.toLowerCase())) {
            const span = el.ownerDocument.createElement('span')
            span.appendChild(el.ownerDocument.createTextNode('\r'))
            node.childNodes.forEach(cn => {
              span.appendChild(cn.cloneNode(true))
            })
            if (index !== el.childNodes.length) {
              span.appendChild(el.ownerDocument.createTextNode('\r'))
            }
            children.push(span)
          } else {
            children.push(node)
          }
        })

        return {
          _type: 'block',
          style: 'blockquote',
          markDefs: [],
          children: next(children)
        }
      }
    },

    // Block elements
    {
      deserialize(el, next) {
        const blocks = {...HTML_BLOCK_TAGS, ...HTML_HEADER_TAGS}
        let block = blocks[tagName(el)]
        if (!block) {
          return undefined
        }
        // Don't add blocks into list items
        if (el.parentNode && tagName(el) === 'li') {
          return next(el.childNodes)
        }
        // If style is not supported, return a defaultBlockType
        if (!options.enabledBlockStyles.includes(block.style)) {
          block = DEFAULT_BLOCK
        }
        return {
          ...block,
          children: next(el.childNodes)
        }
      }
    },

    // Ignore span tags
    {
      deserialize(el, next) {
        const span = HTML_SPAN_TAGS[tagName(el)]
        if (!span) {
          return undefined
        }
        return next(el.childNodes)
      }
    },

    // Ignore list containers
    {
      deserialize(el, next) {
        const listContainer = HTML_LIST_CONTAINER_TAGS[tagName(el)]
        if (!listContainer) {
          return undefined
        }
        return next(el.childNodes)
      }
    },

    // Deal with br's
    {
      deserialize(el, next) {
        if (tagName(el) === 'br') {
          return {
            ...DEFAULT_SPAN,
            text: '\n'
          }
        }
        return undefined
      }
    },

    // Deal with list items
    {
      deserialize(el, next) {
        const listItem = HTML_LIST_ITEM_TAGS[tagName(el)]
        if (!listItem || !el.parentNode || !HTML_LIST_CONTAINER_TAGS[tagName(el.parentNode)]) {
          return undefined
        }
        listItem.listItem = resolveListItem(tagName(el.parentNode))
        return {
          ...listItem,
          children: next(el.childNodes)
        }
      }
    },

    // Deal with decorators
    {
      deserialize(el, next) {
        const decorator = HTML_DECORATOR_TAGS[tagName(el)]
        if (!decorator || !options.enabledSpanDecorators.includes(decorator)) {
          return undefined
        }
        return {
          _type: '__decorator',
          name: decorator,
          children: next(el.childNodes)
        }
      }
    },

    // Special case for hyperlinks, add annotation (if allowed by schema),
    // If not supported just write out the link text and href in plain text.
    {
      deserialize(el, next) {
        if (tagName(el) != 'a') {
          return undefined
        }
        const linkEnabled = options.enabledBlockAnnotations.includes('link')
        const href = el.getAttribute('href')
        if (!href) {
          return next(el.childNodes)
        }
        let markDef
        if (linkEnabled) {
          markDef = {
            _key: randomKey(12),
            _type: 'link',
            href: href
          }
        }
        return {
          _type: '__annotation',
          markDef: markDef,
          children: linkEnabled
            ? next(el.childNodes)
            : el.appendChild(el.ownerDocument.createTextNode(` (${href})`)) && next(el.childNodes)
        }
      }
    }
  ]
}
