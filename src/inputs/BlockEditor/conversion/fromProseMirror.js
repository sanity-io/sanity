// Todo: support more prosemirror types
const TRANSFORMS = {
  /* eslint-disable camelcase */
  paragraph(node) {
    return {
      _type: 'paragraph',
      content: (node.content || []).map(fromProseMirror)
    }
  },
  list_item(node) {
    return {
      _type: 'listItem',
      content: (node.content || []).map(fromProseMirror)
    }
  },
  bullet_list(node) {
    return {
      _type: 'listItem',
      content: (node.content || []).map(fromProseMirror)
    }
  },
  hard_break(node) {
    return {
      _type: 'listItem',
      content: (node.content || []).map(fromProseMirror)
    }
  },
  text(node) {
    return {
      _type: 'text',
      text: node.text,
      marks: (node.marks || []).map(convertMark)
    }
  },
  doc(node) {
    return node.content.map(fromProseMirror).filter(Boolean)
  }
  /* eslint-enable camelcase */
}

function convertMark(mark) {
  const {_, ...attrs} = mark
  return {type: _, attributes: attrs}
}

export default function fromProseMirror(node) {
  const pmTransform = TRANSFORMS[node.type]

  if (pmTransform) {
    return pmTransform(node)
  }

  if (node.attrs.value) {
    return node.attrs.value.serialize()
  }

  throw new Error(`Don't know how to transform node of type: ${node.type}`)
}
