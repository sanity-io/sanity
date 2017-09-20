// @flow
import {resolveTypeName} from '../../../utils/resolveTypeName'

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

function sanitySpanToRawSlateBlockNode(span, sanityBlock) {

  if (span._type !== 'span') {
    return {
      kind: 'inline',
      isVoid: true,
      type: span._type,
      key: span._key,
      data: {value: span},
      nodes: []
    }
  }

  const {text, marks = []} = span
  const decorators = marks.filter(mark => {
    return !sanityBlock.markDefs.map(def => def._key).includes(mark)
  })
  const annotationKeys = marks.filter(x => decorators.indexOf(x) == -1)
  let annotations
  if (annotationKeys.length) {
    annotations = {}
    annotationKeys.forEach(key => {
      const annotation = sanityBlock.markDefs.find(def => def._key === key)
      annotations[annotation._type] = annotation
    })
  }

  const range = {
    kind: 'range',
    text: text,
    marks: decorators.map(toRawMark)
  }

  if (!annotations) {
    return {kind: 'text', ranges: [range]}
  }

  return {
    kind: 'inline',
    isVoid: false,
    type: 'span',
    key: span._key,
    data: {annotations},
    nodes: [{kind: 'text', ranges: [range]}]
  }
}

function sanityBlockToRawNode(sanityBlock, type) {
  // eslint-disable-next-line no-unused-vars
  const {children, _type, ...rest} = sanityBlock

  const restData = hasKeys(rest) ? {data: {_type, ...rest}} : {}

  return {
    kind: 'block',
    isVoid: false,
    type: 'contentBlock',
    ...restData,
    nodes: children.map(child => sanitySpanToRawSlateBlockNode(child, sanityBlock))
  }
}

function sanityBlockItemToRaw(blockItem, type) {
  return {
    kind: 'block',
    type: type ? type.name : '__unknown', // __unknown is needed to map to component in slate schema, see prepareSlateForBlockEditor.js
    isVoid: true,
    data: {value: blockItem},
    nodes: []
  }
}

function sanityBlockItemToRawNode(blockItem, type) {
  const blockItemType = resolveTypeName(blockItem)

  const memberType = type.of.find(ofType => ofType.name === blockItemType)

  return blockItemType === 'block'
    ? sanityBlockToRawNode(blockItem, memberType)
    : sanityBlockItemToRaw(blockItem, memberType)
}

function sanityBlocksArrayToRawNodes(blockArray, type) {
  return blockArray
    .filter(Boolean) // this is a temporary guard against null values, @todo: remove
    .map(item => sanityBlockItemToRawNode(item, type))
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
