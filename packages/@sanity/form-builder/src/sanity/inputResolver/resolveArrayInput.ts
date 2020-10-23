import OptionsArray from '../../inputs/OptionsArrayInput'
import PortableTextInput from '../../inputs/PortableText/PortableTextInput'
import ArrayOfPrimitivesInput from '../../inputs/ArrayOfPrimitivesInput'
import TagsArrayInput from '../../inputs/TagsArrayInput'
import * as is from '../../utils/is'
import {get} from 'lodash'
import SanityArrayInput from '../inputs/SanityArrayInput'

const PRIMITIVES = ['string', 'number', 'boolean']

export function isArrayOfPrimitives(type) {
  return type.of.every((ofType) => PRIMITIVES.includes(ofType.jsonType))
}

function isTagsArray(type) {
  return (
    get(type.options, 'layout') === 'tags' && type.of.length === 1 && is.type('string', type.of[0])
  )
}

function isPortableText(type) {
  // TODO: better testing here, not only for type 'block' !
  return type.of.some((memberType) => is.type('block', memberType))
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

  // Use Portable Text editor if portable text.

  if (isPortableText(type)) {
    return PortableTextInput
  }

  // use default
  return SanityArrayInput
}
