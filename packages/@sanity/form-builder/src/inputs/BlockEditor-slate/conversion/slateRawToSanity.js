// Converts a persisted array to a slate compatible json document
import {get, flatten, omit, isUndefined} from 'lodash'
import {createMemberValue} from '../../../state/FormBuilderState'


function toRawBlock(block, context) {
  const {spans, ...rest} = block
  return {
    kind: 'block',
    type: 'block',
    data: rest,
    nodes: [
      {
        kind: 'text',
        ranges: spans.map(span => {
          return {
            kind: 'range',
            text: span.text,
            marks: (span.marks || []).map(mark => ({
              kind: 'mark',
              type: mark
            }))
          }
        })
      }
    ]
  }
}

function toRawCustom(node, context) {
  return {
    kind: 'block',
    type: context.type.name,
    isVoid: true,
    data: {value: createMemberValue(node, context)},
    nodes: []
  }
}

function toRawNode(node, context) {
  if (context.type.name === 'block') {
    return toRawBlock(node, context)
  }
  return toRawCustom(node, context)
}

function toSanityBlock(block) {
  if (block.type === 'block') {
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
  debugger
  return block.data.value
}


export default function slateRawToSanity(raw) {
  const nodes = get(raw, 'document.nodes')
  if (!nodes || nodes.length === 0) {
    return undefined
  }

  return nodes.map(toSanityBlock)
}
