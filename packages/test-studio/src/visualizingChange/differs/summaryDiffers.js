/* eslint-disable id-length */

function extractText(blockContent) {
  return blockContent
    .map(item => (item._type == 'span' ? item.text : null))
    .filter(Boolean)
    .join(' ')
}

const differs = {
  block: (a, b) => {
    const aText = extractText(a.children)
    const bText = extractText(b.children)
    if (aText !== bText) {
      return [
        {
          op: 'editText',
          type: 'block',
          from: aText,
          to: bText
        }
      ]
    }
    return []
  },
  string: (a, b) => {
    return [
      {
        op: 'editText',
        type: 'string',
        from: a,
        to: b
      }
    ]
  },
  image: (a, b) => {
    if (a.asset && b.asset && a.asset._ref !== b.asset._ref) {
      return [{op: 'replaceImage', from: a.asset._ref, to: b.asset._ref}]
    }
    return []
  }
}

export default differs
