// Converts a persisted array to a slate compatible json document
import {get, flatten} from 'lodash'

function toSanityBlock(block) {
  if (block.type === 'contentBlock') {
    return {
      ...block.data,
      _type: 'block',
      spans: flatten(block.nodes.map(child => {
        if (child.kind === 'text') {
          return child.ranges.map(range => {
            return {
              _type: 'span',
              text: range.text,
              marks: range.marks.map(mark => mark.type)
            }
          })
        }
        throw new Error(`Unsupported kind ${child.kind}`)
      }))
    }
  }
  return block.data.value
}


export default function slateRawToSanity(raw) {
  const nodes = get(raw, 'document.nodes')
  if (!nodes || nodes.length === 0) {
    return undefined
  }

  return nodes.map(toSanityBlock)
}
