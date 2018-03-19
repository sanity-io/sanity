import OptionsArray from '../../inputs/OptionsArrayInput'
import BlockEditor from '../../inputs/BlockEditor'
import ArrayOfPrimitivesInput from '../../inputs/ArrayOfPrimitivesInput'
import TagsArrayInput from '../../inputs/TagsArrayInput'
import * as is from '../../utils/is'
import {get} from 'lodash'

const PRIMITIVES = ['string', 'number', 'boolean']

export function isArrayOfPrimitives(type) {
  return type.of.every(ofType => PRIMITIVES.includes(ofType.jsonType))
}

function isTagsArray(type) {
  return (
    get(type.options, 'layout') === 'tags' && type.of.length === 1 && is.type('string', type.of[0])
  )
}

function hasBlocks(type) {
  return type.of.some(memberType => is.type('block', memberType))
}

export function hasOptionsList(type) {
  return get(type.options, 'list')
}

export default function resolveArrayInput(type) {
  // Schema provides predefines list
  if (hasOptionsList(type)) {
    return OptionsArray
  }

  if (isTagsArray(type)) {
    return TagsArrayInput
  }

  // Special component for array of primitive values
  if (isArrayOfPrimitives(type)) {
    return ArrayOfPrimitivesInput
  }

  // Use block editor if its an array that includes blocks
  if (hasBlocks(type)) {
    return BlockEditor
  }

  // use default
  return null
}
