import {Html} from 'slate'

const BLOCK_TAGS = {
  p: 'paragraph'
}

const HEADER_TAGS = {
  h1: 'header',
  h2: 'header',
  h3: 'header',
  h4: 'header',
  h5: 'header',
  h6: 'header'
}

const MARK_TAGS = {
  b: 'bold',
  i: 'italic',
  strong: 'bold',
  em: 'italic',
  u: 'underline',
  s: 'strikethrough',
  code: 'code'
}

const RULES = [
  {
    deserialize(el, next) {
      const block = BLOCK_TAGS[el.tagName]
      if (!block) {
        return null
      }
      return {
        kind: 'block',
        type: block,
        nodes: next(el.children)
      }
    }
  },
  {
    deserialize(el, next) {
      if (el.tagName === 'ul') {
        return {
          kind: 'block',
          type: 'list',
          data: {
            listStyle: 'bullet'
          },
          nodes: next(el.children)
        }
      }
      return null
    }
  },
  {
    deserialize(el, next) {
      if (el.tagName === 'ol') {
        return {
          kind: 'block',
          type: 'list',
          data: {
            listStyle: 'number'
          },
          nodes: next(el.children)
        }
      }
      return null
    }
  },
  {
    deserialize(el, next) {
      if (el.tagName === 'li') {
        return {
          kind: 'block',
          type: 'listItem',
          nodes: next(el.children)
        }
      }
      return null
    }
  },
  {
    deserialize(el, next) {
      const header = HEADER_TAGS[el.tagName]
      if (!header) {
        return null
      }
      return {
        kind: 'block',
        type: header,
        data: {
          level: parseInt(el.tagName.replace(/^\D+/g, ''), 0)
        },
        nodes: next(el.children)
      }
    }
  },
  {
    deserialize(el, next) {
      const mark = MARK_TAGS[el.tagName]
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
    // Special case for code blocks, which need to grab the nested children.
    deserialize(el, next) {
      if (el.tagName != 'pre') {
        return null
      }
      const code = el.children[0]
      const children = code && code.tagName == 'code'
        ? code.children
        : el.children
      return {
        kind: 'block',
        type: 'code',
        nodes: next(children)
      }
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
        type: 'link',
        nodes: next(el.children),
        data: {
          href: el.attribs.href,
          target: '_blank'
        }
      }
    }
  }
]

const serializer = new Html({rules: RULES})

function OnPasteHtml(...args) {

  function onPaste(event, data, state, editor) {

    if (data.type != 'html') {
      return null
    }
    if (data.isShift) {
      return null
    }

    const {document} = serializer.deserialize(data.html)

    return state
      .transform()
      .insertFragment(document)
      .apply()

  }

  return {
    onPaste
  }
}

export default OnPasteHtml
