import {uniq} from 'lodash'
import randomKey from '../util/randomKey'
import resolveJsType from '../util/resolveJsType'
import blockContentTypeFeatures from '../util/blockContentTypeFeatures'
import normalizeBlock from '../util/normalizeBlock'

const EMPTY_TEXT_NODE = {
  object: 'text',
  leaves: [
    {
      object: 'leaf',
      text: '',
      marks: []
    }
  ]
}

function resolveTypeName(value) {
  const jsType = resolveJsType(value)
  return (jsType === 'object' && '_type' in value && value._type) || jsType
}

function hasKeys(obj) {
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      return true
    }
  }
  return false
}

function toRawMark(markName) {
  return {
    object: 'mark',
    type: markName
  }
}

function sanitySpanToRawSlateBlockNode(span, sanityBlock, blockContentFeatures, childIndex) {
  // Inline object
  if (span._type !== 'span') {
    const spanKey = `${sanityBlock._key}${childIndex()}`
    span._key = spanKey
    return {
      object: 'inline',
      isVoid: true,
      key: spanKey,
      type: span._type,
      data: {value: span, _key: spanKey},
      nodes: [EMPTY_TEXT_NODE]
    }
  }

  const {text, marks = []} = span
  const schemaDecorators = blockContentFeatures.decorators.map(decorator => decorator.value)
  const decorators = marks.filter(mark => schemaDecorators.includes(mark))
  const annotationKeys = marks.filter(
    mark =>
      decorators.indexOf(mark) === -1 && sanityBlock.markDefs.map(def => def._key).includes(mark)
  )
  let annotations
  if (annotationKeys.length) {
    annotations = {}
    annotationKeys.forEach(key => {
      const annotation = sanityBlock.markDefs.find(def => def._key === key)
      if (annotations && annotation) {
        annotations[annotation._type] = annotation
      }
    })
  }
  const leaf = {
    object: 'leaf',
    text: text,
    marks: uniq(decorators.concat(annotationKeys).filter(Boolean)).map(toRawMark)
  }
  if (!annotations) {
    return {object: 'text', leaves: [leaf], key: `${sanityBlock._key}${childIndex()}`}
  }

  const spanKey = `${sanityBlock._key}${childIndex()}`

  return {
    object: 'inline',
    isVoid: false,
    type: 'span',
    key: spanKey,
    data: {_key: spanKey, annotations: annotations},
    nodes: [{object: 'text', leaves: [leaf]}]
  }
}

// Block type object
function sanityBlockToRawNode(sanityBlock, blockContentFeatures, options = {}) {
  const {children, _type, markDefs, ...rest} = sanityBlock
  if (!sanityBlock._key) {
    sanityBlock._key = randomKey(12)
  }
  let restData = {}
  if (hasKeys(rest)) {
    restData = {data: {_type, _key: sanityBlock._key, ...rest}}
    // Check if we should allow listItem if present
    const {listItem} = restData.data
    if (listItem && !blockContentFeatures.lists.find(list => list.value === listItem)) {
      delete restData.data.listItem
    }
    // Check if we should allow style if present
    const {style} = restData.data
    if (style && !blockContentFeatures.styles.find(_style => _style.value === style)) {
      restData.data.style = 'normal'
    }
  }

  let index = 0
  const childIndex = () => {
    return index++
  }

  const block = {
    object: 'block',
    key: sanityBlock._key,
    isVoid: false,
    type: 'contentBlock',
    ...restData,
    nodes:
      children.length > 0
        ? children.map(child =>
            sanitySpanToRawSlateBlockNode(child, sanityBlock, blockContentFeatures, childIndex)
          )
        : [EMPTY_TEXT_NODE]
  }
  if (options.normalize) {
    return normalizeBlock(block)
  }
  return block
}

// Embedded object
function sanityBlockItemToRaw(blockItem, blockContentFeatures) {
  if (!blockItem._key) {
    blockItem._key = randomKey(12)
  }
  const type = blockContentFeatures.types.blockObjects
    .map(objType => objType.name)
    .concat('block')
    .includes(blockItem._type)
    ? blockItem._type
    : '__unknown'
  return {
    object: 'block',
    key: blockItem._key,
    type,
    isVoid: true,
    data: {value: blockItem, _key: blockItem._key},
    nodes: [EMPTY_TEXT_NODE]
  }
}

function sanityBlockItemToRawNode(blockItem, type, blockContentFeatures, options) {
  const blockItemType = resolveTypeName(blockItem)

  return blockItemType === 'block'
    ? sanityBlockToRawNode(blockItem, blockContentFeatures, options)
    : sanityBlockItemToRaw(blockItem, blockContentFeatures, options)
}

function sanityBlocksArrayToRawNodes(blockArray, type, blockContentFeatures, options = {}) {
  return blockArray.map(item => sanityBlockItemToRawNode(item, type, blockContentFeatures, options))
}

export default function blocksToEditorValue(array, type, options = {}) {
  const blockContentFeatures = blockContentTypeFeatures(type)
  return {
    object: 'value',
    data: {},
    document: {
      key: randomKey(12),
      object: 'document',
      data: {},
      nodes:
        array && array.length > 0
          ? sanityBlocksArrayToRawNodes(array, type, blockContentFeatures, options)
          : []
    }
  }
}
