// Converts a persisted array to a slate compatible json document
import {createMemberValue} from '../../../state/FormBuilderState'

function toRawBlock(block, context) {
  const {spans, ...rest} = block
  return {
    kind: 'block',
    type: 'contentBlock',
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

function toRawNodes(nodes, context) {
  return nodes
    .filter(Boolean) // this is a temporary guard against null values, @todo: remove
    .map(node => {
      const memberType = context.type.of.find(ofType => ofType.name === node._type)
      return toRawNode(node, {
        ...context,
        type: memberType
      })
    })
}

const EMPTY_NODE = {kind: 'block', type: 'contentBlock', data: {style: 'normal'}, nodes: []}
export default function sanityToSlateRaw(array, context) {
  return {
    kind: 'state',
    document: {
      kind: 'document',
      nodes: (array && array.length > 0) ? toRawNodes(array, context) : [EMPTY_NODE]
    }
  }
}
