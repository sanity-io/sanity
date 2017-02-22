import * as helpers from './helpers'

export const defaultBlockType = {
  kind: 'block',
  type: 'contentBlock',
  data: {style: 'normal'}
}

function variant(type, data) {
  const _variant = Object.assign({}, type)
  _variant.data = Object.assign({}, type.data || {}, data)
  return _variant
}


export const HTML_BLOCK_TAGS = {
  p: defaultBlockType,
  blockquote: variant(defaultBlockType, {style: 'blockquote'})
}

export const HTML_SPAN_TAGS = {
  span: {kind: 'text'}
}

export const HTML_LIST_CONTAINER_TAGS = {
  ol: {kind: null},
  ul: {kind: null}
}

export const HTML_HEADER_TAGS = {
  h1: variant(defaultBlockType, {style: 'h1'}),
  h2: variant(defaultBlockType, {style: 'h2'}),
  h3: variant(defaultBlockType, {style: 'h3'}),
  h4: variant(defaultBlockType, {style: 'h4'}),
  h5: variant(defaultBlockType, {style: 'h5'}),
  h6: variant(defaultBlockType, {style: 'h6'})
}

export const HTML_MARK_TAGS = {

  b: 'strong',
  strong: 'strong',

  i: 'em',
  em: 'em',

  u: 'underline',
  s: 'strike-through',
  strike: 'strike-through',
  del: 'strike-through',

  code: 'code'
}

export const HTML_LIST_ITEM_TAGS = {
  li: defaultBlockType
}

export const elementMap = {
  ...HTML_BLOCK_TAGS,
  ...HTML_SPAN_TAGS,
  ...HTML_LIST_CONTAINER_TAGS,
  ...HTML_HEADER_TAGS,
}

export const supportedStyles = Array.from(
  new Set(
    Object.keys(elementMap)
    .filter(tag => elementMap[tag].data && elementMap[tag].data.style)
    .map(tag => elementMap[tag].data.style)
  )
)

export const supportedMarks = Array.from(
  new Set(
    Object.keys(HTML_MARK_TAGS)
    .map(tag => HTML_MARK_TAGS[tag])
  )
)


export function createRules(options) {
  const noop = () => undefined
  const createFieldValue = options.createFieldValueFn || noop
  const enabledStyles = options.enabledStyles || supportedStyles
  const enabledMarks = options.enabledMarks || supportedMarks
  return [
    // Special case for Google Docs which always
    // wrap the html data in a <b> tag :/
    {
      deserialize(el, next) {
        if (helpers.isPastedFromGoogleDocs(el)) {
          return next(el.children)
        }
        return null
      }
    },
    // Block and header tags
    {
      deserialize(el, next) {
        const blockAndHeaderTags = {...HTML_BLOCK_TAGS, ...HTML_HEADER_TAGS}
        let block = blockAndHeaderTags[el.tagName]
        if (!block) {
          return null
        }
        // Don't add blocks into list items
        if (el.parentNode && el.parentNode.tagName === 'li') {
          return next(el.children)
        }
        // If style is not supported, return a defaultBlockType
        if (!enabledStyles.includes(block.data.style)) {
          block = defaultBlockType
        }
        return {
          ...block,
          nodes: next(el.children)
        }
      }
    },
    // Ignore span tags
    {
      deserialize(el, next) {
        const span = HTML_SPAN_TAGS[el.tagName]
        if (!span) {
          return null
        }
        return next(el.children)
      }
    },
    // Ignore list containers
    {
      deserialize(el, next) {
        const listContainer = HTML_LIST_CONTAINER_TAGS[el.tagName]
        if (!listContainer) {
          return null
        }
        return next(el.children)
      }
    },
    // Deal with list items
    {
      deserialize(el, next) {
        const listItem = HTML_LIST_ITEM_TAGS[el.tagName]
        if (!listItem
            || !el.parent
            || !HTML_LIST_CONTAINER_TAGS[el.parent.tagName]) {
          return null
        }
        return {
          ...variant(
              listItem,
              {listItem: helpers.resolveListItem(el.parent.tagName)}
            ),
          nodes: next(el.children, true)
        }
      }
    },
    // Deal with marks
    {
      deserialize(el, next) {
        const mark = HTML_MARK_TAGS[el.tagName]
        if (!mark || !enabledMarks.includes(mark)) {
          return null
        }
        return {
          kind: 'mark',
          type: mark,
          nodes: next(el.children)
        }
      }
    },
    // Special case for links, to grab their href.
    {
      deserialize(el, next) {
        if (el.tagName != 'a') {
          return null
        }
        return {
          kind: 'inline',
          type: 'span',
          nodes: next(el.children),
          data: {value: createFieldValue(el)}
        }
      }
    },
    // {
    //   // Special case for code blocks, which need to grab the nested children.
    //   deserialize(el, next) {
    //     if (el.tagName != 'pre') {
    //       return null
    //     }
    //     const code = el.children[0]
    //     const children = code && code.tagName == 'code'
    //       ? code.children
    //       : el.children
    //     return {
    //       kind: 'block',
    //       type: 'code',
    //       nodes: next(children)
    //     }
    //   }
    // },
  ]
}

