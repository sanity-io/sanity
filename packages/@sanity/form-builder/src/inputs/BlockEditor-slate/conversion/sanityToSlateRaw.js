// Converts a persisted array to a slate compatible json document
import {createMemberValue} from '../../../state/FormBuilderState'
import {getSpanType} from '../util/spanHelpers'

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
    data: {value: createMemberValue({_type, ...rest}, context)},
    nodes: [
      {kind: 'text', ranges: [range]}
    ]
  }
}

function sanityBlockToRawNode(sanityBlock, context) {
  // eslint-disable-next-line no-unused-vars
  const {spans, _type, ...rest} = sanityBlock

  // todo: refactor
  const spanType = context.type.fields
    .find(field => field.name === 'spans').type.of
    .find(spanMemberType => spanMemberType.name === 'span')

  const spanContext = {
    ...context,
    type: spanType
  }

  const restData = hasKeys(rest) ? {data: {_type, ...rest}} : {}

  return {
    kind: 'block',
    isVoid: false,
    type: 'contentBlock',
    ...restData,
    nodes: spans.map(span => sanitySpanToRawSlateBlockNode(span, spanContext))
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
