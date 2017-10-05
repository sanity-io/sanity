import OptionsArray from '../../inputs/OptionsArray/OptionsArray'
import BlockEditor from '../../inputs/BlockEditor-slate'
import ArrayOfPrimitivesInput from '../../inputs/ArrayOfPrimitives/ArrayOfPrimitives'
import TagsArrayInput from '../../inputs/TagsArray/TagsArray'
import * as is from '../../utils/is'
import {get} from 'lodash'

export function isArrayOfPrimitives(type) {
  return type.of.every(is.primitive)
}

function isTagsArray(type) {
  return get(type.options, 'layout') === 'tags'
    && type.of.length === 1
    && is.type('string', type.of[0])
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
