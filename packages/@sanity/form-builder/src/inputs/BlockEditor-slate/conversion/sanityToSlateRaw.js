// @flow
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

function sanitySpanToRawSlateBlockNode(span) {
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
    data: {value: {_type, ...rest}},
    nodes: [
      {kind: 'text', ranges: [range]}
    ]
  }
}

function sanityBlockToRawNode(sanityBlock, type) {
  // eslint-disable-next-line no-unused-vars
  const {spans, _type, ...rest} = sanityBlock

  // todo: refactor
  const spanType = type.fields
    .find(field => field.name === 'spans').type.of
    .find(spanMemberType => spanMemberType.name === 'span')

  const restData = hasKeys(rest) ? {data: {_type, ...rest}} : {}

  return {
    kind: 'block',
    isVoid: false,
    type: 'contentBlock',
    ...restData,
    nodes: spans.map(span => sanitySpanToRawSlateBlockNode(span, spanType))
  }
}

function sanityBlockItemToRaw(blockItem, type) {
  return {
    kind: 'block',
    type: type.name,
    isVoid: true,
    data: {value: blockItem},
    nodes: []
  }
}

function sanityBlockItemToRawNode(blockItem, type) {
  if (type.name === 'block') {
    return sanityBlockToRawNode(blockItem, type)
  }
  return sanityBlockItemToRaw(blockItem, type)
}

function sanityBlocksArrayToRawNodes(blockArray, type) {
  return blockArray
    .filter(Boolean) // this is a temporary guard against null values, @todo: remove
    .map(item => {
      const memberType = type.of.find(ofType => ofType.name === item._type)
      return sanityBlockItemToRawNode(item, memberType)
    })
}

const EMPTY_NODE = {kind: 'block', type: 'contentBlock', data: {style: 'normal'}, nodes: []}

export default function sanityToSlateRaw(array, type) {
  return {
    kind: 'state',
    document: {
      kind: 'document',
      nodes: (array && array.length > 0) ? sanityBlocksArrayToRawNodes(array, type) : [EMPTY_NODE]
    }
  }
}
