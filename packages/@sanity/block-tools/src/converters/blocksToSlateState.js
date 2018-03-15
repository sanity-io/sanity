// @flow

import randomKey from '../util/randomKey'
import resolveJsType from '../util/resolveJsType'

import {SLATE_DEFAULT_BLOCK} from '../constants'

function resolveTypeName(value) {
  const jsType = resolveJsType(value)
  return (jsType === 'object' && '_type' in value && value._type) || jsType
}

function hasKeys(obj) {
  for (const key in obj) {
    // eslint-disable-line guard-for-in
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
  if (!span._key) {
    span._key = randomKey(12)
  }

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
    marks: decorators.filter(Boolean).map(toRawMark)
  }

  if (!annotations) {
    return {kind: 'text', key: span._key, ranges: [range]}
  }

  return {
    kind: 'inline',
    isVoid: false,
    key: span._key,
    type: 'span',
    data: {annotations},
    nodes: [{kind: 'text', ranges: [range]}]
  }
}

// Block type object
function sanityBlockToRawNode(sanityBlock, type) {
  // eslint-disable-next-line no-unused-vars
  const {children, _type, markDefs, ...rest} = sanityBlock

  const restData = hasKeys(rest) ? {data: {_type, ...rest}} : {}

  if (!sanityBlock._key) {
    sanityBlock._key = randomKey(12)
  }

  return {
    kind: 'block',
    key: sanityBlock._key,
    isVoid: false,
    type: 'contentBlock',
    ...restData,
    nodes: children.map(child => sanitySpanToRawSlateBlockNode(child, sanityBlock))
  }
}

// Embedded object
function sanityBlockItemToRaw(blockItem, type) {
  if (!blockItem._key) {
    blockItem._key = randomKey(12)
  }
  return {
    kind: 'block',
    key: blockItem._key,
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

export default function blocksToSlateState(array, type) {
  const defaultNodes = [{...SLATE_DEFAULT_BLOCK, nodes: [{kind: 'text', text: ''}]}]
  return {
    kind: 'state',
    document: {
      kind: 'document',
      data: {},
      nodes: array && array.length > 0 ? sanityBlocksArrayToRawNodes(array, type) : defaultNodes
    }
  }
}
