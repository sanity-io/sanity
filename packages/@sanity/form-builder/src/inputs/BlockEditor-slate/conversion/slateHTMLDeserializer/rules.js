import * as helpers from './helpers'

export const HTML_BLOCK_TAGS = {
  p: {type: 'contentBlock', style: 'normal'},
  blockquote: {type: 'contentBlock', style: 'blockquote'}
}

export const HTML_SPAN_TAGS = {
  span: {kind: 'text'}
}

export const HTML_LIST_CONTAINER_TAGS = {
  ol: {type: null},
  ul: {type: null}
}

export const HTML_HEADER_TAGS = {
  h1: {type: 'contentBlock', style: 'h1'},
  h2: {type: 'contentBlock', style: 'h2'},
  h3: {type: 'contentBlock', style: 'h3'},
  h4: {type: 'contentBlock', style: 'h4'},
  h5: {type: 'contentBlock', style: 'h5'},
  h6: {type: 'contentBlock', style: 'h6'}
}

export const HTML_MARK_TAGS = {

  b: 'strong',
  strong: 'strong',

  i: 'em',
  em: 'em',

  u: 'underline',
  s: 'strikethrough',

  code: 'code'
}

export const HTML_LIST_ITEM_TAGS = {
  li: {type: 'contentBlock', style: 'normal'},
}


export const defaultBlockType = {
  kind: 'block',
  type: 'contentBlock',
  data: {style: 'normal'}
}

export const rules = {
  ...HTML_BLOCK_TAGS,
  ...HTML_SPAN_TAGS,
  ...HTML_LIST_CONTAINER_TAGS,
  ...HTML_HEADER_TAGS,
  ...HTML_MARK_TAGS
}

export function createRules(createFieldValue) {
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
    {
      deserialize(el, next) {
        const block = HTML_BLOCK_TAGS[el.tagName]
        if (!block) {
          return null
        }
        // Don't add blocks into list items
        if (el.parentNode && el.parentNode.tagName === 'li') {
          return next(el.children)
        }
        return {
          ...defaultBlockType,
          nodes: next(el.children)
        }
      }
    },
    {
      deserialize(el, next) {
        const span = HTML_SPAN_TAGS[el.tagName]
        if (!span) {
          return null
        }
        return next(el.children)
      }
    },
    {
      deserialize(el, next) {
        const listContainer = HTML_LIST_CONTAINER_TAGS[el.tagName]
        if (!listContainer) {
          return null
        }
        return next(el.children)
      }
    },
    {
      deserialize(el, next) {
        const header = HTML_HEADER_TAGS[el.tagName]
        if (!header) {
          return null
        }
        return {
          kind: 'block',
          type: header.type,
          data: {style: header.style},
          nodes: next(el.children)
        }
      }
    },
    {
      deserialize(el, next) {
        const mark = HTML_MARK_TAGS[el.tagName]
        if (!mark) {
          return null
        }
        return {
          kind: 'mark',
          type: mark,
          nodes: next(el.children)
        }
      }
    },
    {
      deserialize(el, next) {
        if (el.tagName === 'li') {
          return {
            ...defaultBlockType,
            data: {
              listItem: helpers.resolveListItem(el.parent.tagName),
              style: 'normal'
            },
            nodes: next(el.children, true)
          }
        }
        return null
      }
    },
    {
      // Special case for links, to grab their href.
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

