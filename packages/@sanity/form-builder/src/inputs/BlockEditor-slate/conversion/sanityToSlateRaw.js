// Converts a persisted array to a slate compatible json document
import {createMemberValue} from '../../../state/FormBuilderState'

function hasKeys(obj) {
  for (const key in obj) { // eslint-disable-line guard-for-in
    return true
  }
  return false
}

function toRawMark(markName) {
  return {
    kind: 'mark',
    type: markName
  }
}

function sanitySpanToRawSlateBlockNode(span, context) {
  // eslint-disable-next-line no-unused-vars
  const {text, _type, marks = [], ...rest} = span

  const range = {
    kind: 'range',
    text: text,
    marks: marks.map(toRawMark)
  }

  if (!hasKeys(rest)) {
    return {kind: 'text', ranges: [range]}
  }

  return {
    kind: 'inline',
    isVoid: false,
    type: 'span',
    data: {value: createMemberValue(rest, context)},
    nodes: [
      {kind: 'text', ranges: [range]}
    ]
  }
}

function sanityBlockToRawNode(sanityBlock, context) {
  // eslint-disable-next-line no-unused-vars
  const {spans, _type, ...rest} = sanityBlock
  const spansType = context.type.fields.find(ofType => ofType.name === 'spans')

  const restData = hasKeys(rest) ? {data: rest} : {}

  return {
    kind: 'block',
    isVoid: false,
    type: 'contentBlock',
    ...restData,
    nodes: spans.map(span => sanitySpanToRawSlateBlockNode(span, {
      ...context,
      type: spansType
    }))
  }
}

function sanityBlockItemToRaw(blockItem, context) {
  return {
    kind: 'block',
    type: context.type.name,
    isVoid: true,
    data: {value: createMemberValue(blockItem, context)},
    nodes: []
  }
}

function sanityBlockItemToRawNode(blockItem, context) {
  if (context.type.name === 'block') {
    return sanityBlockToRawNode(blockItem, context)
  }
  return sanityBlockItemToRaw(blockItem, context)
}

function sanityBlocksArrayToRawNodes(blockArray, context) {
  return blockArray
    .filter(Boolean) // this is a temporary guard against null values, @todo: remove
    .map(item => {
      const memberType = context.type.of.find(ofType => ofType.name === item._type)
      return sanityBlockItemToRawNode(item, {
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
      nodes: (array && array.length > 0) ? sanityBlocksArrayToRawNodes(array, context) : [EMPTY_NODE]
    }
  }
}
