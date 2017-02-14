import {Html} from 'slate'

const BLOCK_TAGS = {
  p: {type: 'contentBlock', style: 'normal'}
}

const HEADER_TAGS = {
  h1: {type: 'contentBlock', style: 'h1'},
  h2: {type: 'contentBlock', style: 'h2'},
  h3: {type: 'contentBlock', style: 'h3'},
  h4: {type: 'contentBlock', style: 'h4'},
  h5: {type: 'contentBlock', style: 'h5'},
  h6: {type: 'contentBlock', style: 'h6'}
}

const MARK_TAGS = {
  b: 'strong',
  strong: 'strong',
  i: 'em',
  em: 'em',
  u: 'underline',
  s: 'strikethrough',
  code: 'code'
}

function resolveListItem(listNodeTagName) {
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

const RULES = [
  {
    deserialize(el, next) {
      const block = BLOCK_TAGS[el.tagName]
      if (!block) {
        return null
      }
      return {
        kind: 'block',
        type: block.type,
        data: {style: block.style},
        nodes: next(el.children)
      }
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
        type: header.type,
        data: {style: header.style},
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
    deserialize(el, next) {
      if (el.tagName === 'li') {
        const listItem = resolveListItem(el.parentNode.name)
        return {
          kind: 'block',
          type: 'contentBlock',
          data: {
            listItem: listItem
          },
          nodes: next(el.children)
        }
      }
      return null
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
  // {
  //   // Special case for links, to grab their href.
  //   deserialize(el, next) {
  //     if (el.tagName != 'a') {
  //       return null
  //     }
  //     return {
  //       kind: 'inline',
  //       type: 'link',
  //       nodes: next(el.children),
  //       data: {
  //         href: el.attribs.href,
  //         target: '_blank'
  //       }
  //     }
  //   }
  // }
]

const defaultBlockType = {
  type: 'contentBlock',
  data: {style: 'normal'}
}

const serializer = new Html({rules: RULES, defaultBlockType: defaultBlockType})

function OnPasteHtml(...args) {

  function onPaste(event, data, state, editor) {

    if (data.type != 'html') {
      return null
    }
    if (data.isShift) {
      return null
    }

    const {document} = serializer.deserialize(data.html)
//    console.log(document)
//    return null
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
